<?php

namespace App\Services;

use App\Models\SolicitudModel;
use App\Models\MarcacionModel;
use App\Models\HistorialModel;
use App\Models\SaldoModel;

class MarcacionService
{
    public function __construct(
        private readonly SolicitudModel $solicitudes = new SolicitudModel(),
        private readonly MarcacionModel $marcaciones = new MarcacionModel(),
        private readonly HistorialModel $historial   = new HistorialModel(),
        private readonly SaldoModel     $saldos      = new SaldoModel(),
    ) {}

    /**
     * Registra SALIDA o RETORNO y devuelve el bloque de respuesta para Control.
     * Lanza \RuntimeException con mensaje apto para el operador.
     */
    public function registrar(
        string $codigo, int $idPuesto, int $idUsuario,
        string $origen = 'LECTOR', ?string $observacion = null
    ): array {
        $db = db_connect();

        $solicitud = $db->table('permiso_solicitud_papeleta s')
            ->select('s.*, t.categoria, t.unidad_medida, t.nombre AS tipo_nombre')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->groupStart()
                ->where('s.token_codigo', $codigo)
                ->orWhere('s.nro_solicitud', $codigo)
            ->groupEnd()
            ->get()->getRowArray();

        if (! $solicitud) throw new \RuntimeException('Código de papeleta no válido.');

        $tieneSalida  = $this->marcaciones->existeTipo((int) $solicitud['id_solicitud'], 'SALIDA');
        $tieneRetorno = $this->marcaciones->existeTipo((int) $solicitud['id_solicitud'], 'RETORNO')
            || $this->marcaciones->existeTipo((int) $solicitud['id_solicitud'], 'CIERRE');

        if ($tieneSalida && $tieneRetorno) {
            throw new \RuntimeException('Esta papeleta ya tiene salida y retorno registrados.');
        }

        $accion = $tieneSalida ? 'RETORNO' : 'SALIDA';
        $esPorHoras = ($solicitud['unidad_medida'] ?? '') === 'HORAS';

        if ($accion === 'SALIDA') {
            if ($solicitud['categoria'] !== 'PERMISO') {
                throw new \RuntimeException('Este tipo es una licencia por días: no requiere marcación.');
            }
            if (! in_array($solicitud['estado'], ['APROBADA', 'APROBADA_RRHH'], true)) {
                throw new \RuntimeException('La papeleta está en estado ' . $solicitud['estado'] . '.');
            }
            $hoy = date('Y-m-d');
            if ($hoy < $solicitud['fecha_inicio'] || $hoy > $solicitud['fecha_fin']) {
                throw new \RuntimeException('La papeleta no está autorizada para hoy.');
            }
        }

        if ($accion === 'RETORNO') {
            if (isset($solicitud['con_retorno']) && (int) $solicitud['con_retorno'] === 0) {
                throw new \RuntimeException('Este permiso fue registrado sin retorno. Use la opción "Cerrar sin retorno".');
            }
            if ($solicitud['estado'] !== 'EN_CURSO') {
                throw new \RuntimeException('La papeleta no está en curso.');
            }
        }

        $db->transBegin();
        try {
            $this->marcaciones->insert([
                'id_solicitud'       => $solicitud['id_solicitud'],
                'tipo'               => $accion,
                'origen'             => $origen,
                'id_puesto'          => $idPuesto,
                'id_usuario_control' => $idUsuario,
                'observacion'        => $observacion,
            ]);

            if ($accion === 'SALIDA') {
                $this->solicitudes->update($solicitud['id_solicitud'], ['estado' => 'EN_CURSO']);
                $this->historial->insert([
                    'id_solicitud' => $solicitud['id_solicitud'],
                    'estado_ant'   => $solicitud['estado'],
                    'estado_new'   => 'EN_CURSO',
                    'id_usuario'   => $idUsuario,
                    'comentario'   => 'Salida registrada en Control de Personal.',
                ]);
            } else {
                $salida = $this->marcaciones->horaSalida((int) $solicitud['id_solicitud']);
                $min = $salida ? max(0, (int) round((time() - strtotime($salida)) / 60)) : null;
                $horas = $min !== null ? round($min / 60, 2) : null;

                $update = [
                    'tiempo_empleado_min' => $min,
                    'hora_inicio'         => $salida ? date('H:i:s', strtotime($salida)) : null,
                    'hora_fin'            => date('H:i:s'),
                    'estado'              => 'EJECUTADA',
                ];
                if ($esPorHoras && $horas !== null) {
                    $update['cantidad'] = $horas;
                }

                $this->solicitudes->update($solicitud['id_solicitud'], $update);

                if ($esPorHoras && $horas !== null) {
                    $anio = (int) substr((string) $solicitud['fecha_inicio'], 0, 4);
                    $this->saldos->consumir(
                        (int) $solicitud['id_servidor'],
                        (int) $solicitud['id_tipo'],
                        $anio,
                        $horas
                    );
                }

                $comentario = 'Retorno registrado en Control de Personal.';
                if ($horas !== null) {
                    $comentario .= ' Tiempo real: ' . rtrim(rtrim(number_format($horas, 2, '.', ''), '0'), '.') . ' hora(s).';
                }

                $this->historial->insert([
                    'id_solicitud' => $solicitud['id_solicitud'],
                    'estado_ant'   => 'EN_CURSO',
                    'estado_new'   => 'EJECUTADA',
                    'id_usuario'   => $idUsuario,
                    'comentario'   => $comentario,
                ]);
            }
            $db->transCommit();

            $marcacion = $db->table('permiso_marcacion_control')
                ->where(['id_solicitud' => $solicitud['id_solicitud'], 'tipo' => $accion])
                ->get()->getRowArray();

            $unidadExpr = ! empty($solicitud['id_unidad_solicitud'])
                ? (string) (int) $solicitud['id_unidad_solicitud']
                : 'sv.id_unidad';
            $cargoExpr = ! empty($solicitud['id_cargo_solicitud'])
                ? (string) (int) $solicitud['id_cargo_solicitud']
                : 'sv.id_cargo';

            $sv = $db->table('permiso_servidor sv')
                ->select('sv.*, u.nombre AS unidad, c.nombre AS cargo')
                ->join('permiso_unidad_organica u', 'u.id_unidad = ' . $unidadExpr, 'left')
                ->join('permiso_cargo c', 'c.id_cargo = ' . $cargoExpr, 'left')
                ->where('sv.id_servidor', $solicitud['id_servidor'])
                ->get()->getRowArray();

            $actual = $this->solicitudes->find($solicitud['id_solicitud']);

            return [
                'exito'              => true,
                'nro_solicitud'      => $solicitud['nro_solicitud'],
                'accion_registrada'  => $accion,
                'servidor'           => [
                    'id_servidor' => (int) $sv['id_servidor'],
                    'dni'         => $sv['dni'],
                    'apellidos'   => $sv['apellidos'],
                    'nombres'     => $sv['nombres'],
                    'cargo'       => $sv['cargo'],
                    'unidad'      => $sv['unidad'],
                ],
                'tipo'                => $solicitud['tipo_nombre'],
                'fecha_hora'          => $marcacion['fecha_hora'],
                'tiempo_empleado_min' => $actual['tiempo_empleado_min'] ?? null,
                'cantidad'            => $actual['cantidad'] ?? null,
            ];
        } catch (\Throwable $e) {
            $db->transRollback();
            throw $e;
        }
    }

    /**
     * Cierra automáticamente los permisos sin retorno cuando ya terminó la
     * jornada laboral configurada (hora_corte_jornada).
     */
    public function cerrarSinRetornoVencidas(): int
    {
        $db = db_connect();

        $config = $db->table('permiso_configuracion')
            ->where('clave', 'hora_corte_jornada')
            ->get()->getRowArray();
        $corte = $config['valor'] ?? '17:00';

        $hoy = date('Y-m-d');
        $ahora = date('H:i:s');

        $pendientes = $db->table('permiso_solicitud_papeleta s')
            ->select('s.id_solicitud, s.id_servidor, s.id_tipo, s.fecha_inicio,
                      s.con_retorno, t.unidad_medida,
                      m.fecha_hora AS salida, m.id_usuario_control')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->join('permiso_marcacion_control m', "m.id_solicitud = s.id_solicitud AND m.tipo = 'SALIDA'")
            ->where('s.estado', 'EN_CURSO')
            ->where('s.con_retorno', 0)
            ->where('s.fecha_inicio <=', $hoy)
            ->get()->getResultArray();

        $cerradas = 0;

        foreach ($pendientes as $s) {
            $idSolicitud = (int) $s['id_solicitud'];

            if ($this->marcaciones->existeTipo($idSolicitud, 'RETORNO')
                || $this->marcaciones->existeTipo($idSolicitud, 'CIERRE')) {
                continue;
            }

            $fechaSalida = substr((string) $s['salida'], 0, 10);
            if ($fechaSalida > $hoy) continue;
            if ($fechaSalida === $hoy && $ahora < $corte) continue;

            $salidaTs = strtotime((string) $s['salida']);
            $corteTs  = strtotime($fechaSalida . ' ' . $corte);
            if ($salidaTs === false || $corteTs === false) continue;

            $finTs = max($corteTs, $salidaTs);
            $min   = max(0, (int) round(($finTs - $salidaTs) / 60));
            $horas = round($min / 60, 2);
            $esPorHoras = ($s['unidad_medida'] ?? '') === 'HORAS';

            $db->transBegin();
            try {
                $this->marcaciones->insert([
                    'id_solicitud'       => $idSolicitud,
                    'tipo'               => 'CIERRE',
                    'origen'             => 'MANUAL',
                    'id_usuario_control' => (int) $s['id_usuario_control'],
                    'observacion'        => 'Cierre automático al finalizar la jornada (' . $corte . ').',
                ]);

                $update = [
                    'tiempo_empleado_min' => $min,
                    'hora_inicio'         => date('H:i:s', $salidaTs),
                    'hora_fin'            => date('H:i:s', $finTs),
                    'estado'              => 'EJECUTADA',
                ];
                if ($esPorHoras) {
                    $update['cantidad'] = $horas;
                }

                $this->solicitudes->update($idSolicitud, $update);

                if ($esPorHoras) {
                    $anio = (int) substr((string) $s['fecha_inicio'], 0, 4);
                    $this->saldos->consumir(
                        (int) $s['id_servidor'],
                        (int) $s['id_tipo'],
                        $anio,
                        $horas
                    );
                }

                $this->historial->insert([
                    'id_solicitud' => $idSolicitud,
                    'estado_ant'   => 'EN_CURSO',
                    'estado_new'   => 'EJECUTADA',
                    'id_usuario'   => (int) $s['id_usuario_control'],
                    'comentario'   => 'Permiso cerrado automáticamente al finalizar la jornada (' . $corte . ').',
                ]);

                $db->transCommit();
                $cerradas++;
            } catch (\Throwable $e) {
                $db->transRollback();
            }
        }

        return $cerradas;
    }

    /**
     * Cierra manualmente un permiso marcado como "sin retorno".
     */
    public function cerrarSinRetorno(int $idSolicitud, int $idUsuario, ?string $observacion = null): array
    {
        $db = db_connect();

        $solicitud = $db->table('permiso_solicitud_papeleta s')
            ->select('s.*, t.categoria, t.unidad_medida, t.nombre AS tipo_nombre')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->where('s.id_solicitud', $idSolicitud)
            ->get()->getRowArray();

        if (! $solicitud) throw new \RuntimeException('Solicitud no encontrada.');
        if (($solicitud['categoria'] ?? '') !== 'PERMISO') {
            throw new \RuntimeException('Solo los permisos requieren cierre en Control.');
        }
        if ((int) ($solicitud['con_retorno'] ?? 1) !== 0) {
            throw new \RuntimeException('Este permiso tiene retorno; registre el retorno con el lector.');
        }
        if ($solicitud['estado'] !== 'EN_CURSO') {
            throw new \RuntimeException('El permiso no está en curso.');
        }
        if ($this->marcaciones->existeTipo($idSolicitud, 'RETORNO')
            || $this->marcaciones->existeTipo($idSolicitud, 'CIERRE')) {
            throw new \RuntimeException('El permiso ya fue cerrado.');
        }

        $salida = $this->marcaciones->horaSalida($idSolicitud);
        if (! $salida) throw new \RuntimeException('No existe una salida registrada.');

        $min = max(0, (int) round((time() - strtotime($salida)) / 60));
        $horas = round($min / 60, 2);
        $esPorHoras = ($solicitud['unidad_medida'] ?? '') === 'HORAS';

        $db->transBegin();
        try {
            $this->marcaciones->insert([
                'id_solicitud'       => $idSolicitud,
                'tipo'               => 'CIERRE',
                'origen'             => 'MANUAL',
                'id_usuario_control' => $idUsuario,
                'observacion'        => $observacion ?: 'Cierre manual sin retorno.',
            ]);

            $update = [
                'tiempo_empleado_min' => $min,
                'hora_inicio'         => date('H:i:s', strtotime($salida)),
                'hora_fin'            => date('H:i:s'),
                'estado'              => 'EJECUTADA',
            ];
            if ($esPorHoras) {
                $update['cantidad'] = $horas;
            }

            $this->solicitudes->update($idSolicitud, $update);

            if ($esPorHoras) {
                $anio = (int) substr((string) $solicitud['fecha_inicio'], 0, 4);
                $this->saldos->consumir(
                    (int) $solicitud['id_servidor'],
                    (int) $solicitud['id_tipo'],
                    $anio,
                    $horas
                );
            }

            $this->historial->insert([
                'id_solicitud' => $idSolicitud,
                'estado_ant'   => 'EN_CURSO',
                'estado_new'   => 'EJECUTADA',
                'id_usuario'   => $idUsuario,
                'comentario'   => 'Permiso cerrado sin retorno en Control de Personal.',
            ]);

            $db->transCommit();

            return [
                'exito'               => true,
                'nro_solicitud'       => $solicitud['nro_solicitud'],
                'accion_registrada'   => 'CIERRE',
                'tipo'                => $solicitud['tipo_nombre'],
                'tiempo_empleado_min' => $min,
                'cantidad'            => $esPorHoras ? $horas : $solicitud['cantidad'],
            ];
        } catch (\Throwable $e) {
            $db->transRollback();
            throw $e;
        }
    }
}
