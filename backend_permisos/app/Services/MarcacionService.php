<?php

namespace App\Services;

use App\Models\SolicitudModel;
use App\Models\MarcacionModel;
use App\Models\HistorialModel;

class MarcacionService
{
    public function __construct(
        private readonly SolicitudModel $solicitudes = new SolicitudModel(),
        private readonly MarcacionModel $marcaciones = new MarcacionModel(),
        private readonly HistorialModel $historial   = new HistorialModel(),
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
            ->select('s.*, t.categoria, t.nombre AS tipo_nombre')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->groupStart()
                ->where('s.token_codigo', $codigo)
                ->orWhere('s.nro_solicitud', $codigo)
            ->groupEnd()
            ->get()->getRowArray();

        if (! $solicitud) throw new \RuntimeException('Código de papeleta no válido.');

        $tieneSalida  = $this->marcaciones->existeTipo((int) $solicitud['id_solicitud'], 'SALIDA');
        $tieneRetorno = $this->marcaciones->existeTipo((int) $solicitud['id_solicitud'], 'RETORNO');

        if ($tieneSalida && $tieneRetorno) {
            throw new \RuntimeException('Esta papeleta ya tiene salida y retorno registrados.');
        }

        $accion = $tieneSalida ? 'RETORNO' : 'SALIDA';

        if ($accion === 'SALIDA') {
            if ($solicitud['categoria'] !== 'PERMISO') {
                throw new \RuntimeException('Este tipo es una licencia por días: no requiere marcación.');
            }
            if ($solicitud['estado'] !== 'APROBADA_RRHH') {
                throw new \RuntimeException('La papeleta está en estado ' . $solicitud['estado'] . '.');
            }
            $hoy = date('Y-m-d');
            if ($hoy < $solicitud['fecha_inicio'] || $hoy > $solicitud['fecha_fin']) {
                throw new \RuntimeException('La papeleta no está autorizada para hoy.');
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
                    'estado_ant'   => 'APROBADA_RRHH',
                    'estado_new'   => 'EN_CURSO',
                    'id_usuario'   => $idUsuario,
                    'comentario'   => 'Salida registrada en Control de Personal.',
                ]);
            } else {
                $salida = $this->marcaciones->horaSalida((int) $solicitud['id_solicitud']);
                $min = $salida ? (int) round((time() - strtotime($salida)) / 60) : null;
                $this->solicitudes->update($solicitud['id_solicitud'], [
                    'tiempo_empleado_min' => $min,
                    'estado'              => 'EJECUTADA',
                ]);
                $this->historial->insert([
                    'id_solicitud' => $solicitud['id_solicitud'],
                    'estado_ant'   => 'EN_CURSO',
                    'estado_new'   => 'EJECUTADA',
                    'id_usuario'   => $idUsuario,
                    'comentario'   => 'Retorno registrado en Control de Personal.',
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
            ];
        } catch (\Throwable $e) {
            $db->transRollback();
            throw $e;
        }
    }
}