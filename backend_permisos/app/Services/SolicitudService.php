<?php

namespace App\Services;

use App\Models\SolicitudModel;
use App\Models\AdjuntoModel;
use App\Models\HistorialModel;
use App\Models\SaldoModel;

class SolicitudService
{
    public function __construct(
        private readonly SolicitudModel $solicitudes = new SolicitudModel(),
        private readonly AdjuntoModel   $adjuntos    = new AdjuntoModel(),
        private readonly HistorialModel $historial   = new HistorialModel(),
        private readonly SaldoModel     $saldos      = new SaldoModel(),
    ) {}

    public function crear(array $datos, int $idServidor, int $idUsuario, array $archivos): array
    {
        $db = db_connect();
        $db->transBegin();
        try {
            $esBorrador    = ! empty($datos['borrador']);
            $estadoInicial = $esBorrador ? 'BORRADOR' : 'PENDIENTE';
            $snapshots     = [];

            if (! $esBorrador) {
                $sv = $this->servidor($idServidor);
                if (empty($sv['id_jefe'])) {
                    throw new \RuntimeException('El servidor no tiene jefe inmediato asignado.');
                }
                $this->validarCruceHorario($idServidor, $datos);
                $snapshots = $this->snapshots($sv);
            }

            $nro = $this->nuevoNro($db);
            $id = $this->solicitudes->insert(array_merge([
                'nro_solicitud' => $nro,
                'id_servidor'   => $idServidor,
                'id_tipo'       => (int) $datos['id_tipo'],
                'fecha_inicio'  => $datos['fecha_inicio'] ?? null,
                'fecha_fin'     => $datos['fecha_fin'] ?? null,
                'hora_inicio'   => $datos['hora_inicio'] ?? null,
                'hora_fin'      => $datos['hora_fin'] ?? null,
                'cantidad'      => $datos['cantidad'] ?? 0,
                'motivo'        => $datos['motivo'] ?? null,
                'estado'        => $estadoInicial,
            ], $snapshots), true);

            $this->insertarAdjuntos((int) $id, $archivos);

            $this->historial->insert([
                'id_solicitud' => $id,
                'estado_ant'   => null,
                'estado_new'   => $estadoInicial,
                'id_usuario'   => $idUsuario,
                'comentario'   => $esBorrador ? 'Borrador creado.' : 'Solicitud creada.',
            ]);

            $db->transCommit();
            return $this->solicitudes->detalleCompleto((int) $id);
        } catch (\Throwable $e) {
            $db->transRollback();
            throw $e;
        }
    }

    public function actualizarBorrador(int $idSolicitud, array $datos, array $archivos): array
    {
        $s = $this->solicitudes->find($idSolicitud);
        if (! $s) throw new \RuntimeException('Solicitud no encontrada.');
        if ($s['estado'] !== 'BORRADOR') {
            throw new \RuntimeException('Solo se puede editar un borrador.');
        }

        $db = db_connect();
        $db->transBegin();
        try {
            $update = [];
            foreach (['id_tipo', 'fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin', 'motivo', 'cantidad'] as $campo) {
                if (array_key_exists($campo, $datos)) {
                    $valor = $datos[$campo];
                    $update[$campo] = ($valor === '' || $valor === null) ? null : $valor;
                }
            }

            if ($update !== []) {
                $this->solicitudes->update($idSolicitud, $update);
            }

            $this->insertarAdjuntos($idSolicitud, $archivos);

            $db->transCommit();
            return $this->solicitudes->detalleCompleto($idSolicitud);
        } catch (\Throwable $e) {
            $db->transRollback();
            throw $e;
        }
    }

    public function enviarBorrador(int $idSolicitud, int $idUsuario): array
    {
        $s = $this->solicitudes->find($idSolicitud);
        if (! $s) throw new \RuntimeException('Solicitud no encontrada.');
        if ($s['estado'] !== 'BORRADOR') {
            throw new \RuntimeException('La solicitud no es un borrador.');
        }

        $tipo = db_connect()->table('permiso_tipo_solicitud')
            ->where('id_tipo', $s['id_tipo'])
            ->get()->getRowArray();

        if (! $tipo || ! $tipo['activo']) {
            throw new \RuntimeException('Tipo de solicitud no válido.');
        }
        if (empty($s['fecha_inicio']) || empty($s['fecha_fin'])) {
            throw new \RuntimeException('Debe indicar las fechas de la solicitud.');
        }
        if (empty($s['motivo'])) {
            throw new \RuntimeException('Debe indicar el motivo de la solicitud.');
        }
        if ($tipo['unidad_medida'] === 'HORAS' && (empty($s['hora_inicio']) || empty($s['hora_fin']))) {
            throw new \RuntimeException('Debe indicar la hora de salida y retorno.');
        }
        if ((float) $s['cantidad'] <= 0) {
            throw new \RuntimeException('La cantidad calculada debe ser mayor que cero.');
        }
        if (! empty($tipo['requiere_sustento']) && $this->contarAdjuntos($idSolicitud) < 1) {
            throw new \RuntimeException('Debe adjuntar el documento de sustento.');
        }

        $sv = $this->servidor((int) $s['id_servidor']);
        if (empty($sv['id_jefe'])) {
            throw new \RuntimeException('El servidor no tiene jefe inmediato asignado.');
        }

        $this->validarCruceHorario((int) $s['id_servidor'], $s, $idSolicitud);

        $db = db_connect();
        $db->transBegin();
        try {
            $this->solicitudes->update($idSolicitud, array_merge($this->snapshots($sv), [
                'estado' => 'PENDIENTE',
            ]));
            $this->historial->insert([
                'id_solicitud' => $idSolicitud,
                'estado_ant'   => 'BORRADOR',
                'estado_new'   => 'PENDIENTE',
                'id_usuario'   => $idUsuario,
                'comentario'   => 'Borrador enviado a revisión.',
            ]);
            $db->transCommit();
            return $this->solicitudes->detalleCompleto($idSolicitud);
        } catch (\Throwable $e) {
            $db->transRollback();
            throw $e;
        }
    }

    public function cambiarEstado(
        int $idSolicitud, string $estadoNuevo, int $idUsuario, ?string $comentario = null,
        array $extra = []
    ): void {
        $db = db_connect();
        $db->transBegin();
        try {
            $actual = $this->solicitudes->find($idSolicitud);
            if (! $actual) throw new \RuntimeException('Solicitud inexistente.');

            $this->solicitudes->update($idSolicitud, array_merge($extra, ['estado' => $estadoNuevo]));
            $this->historial->insert([
                'id_solicitud' => $idSolicitud,
                'estado_ant'   => $actual['estado'],
                'estado_new'   => $estadoNuevo,
                'id_usuario'   => $idUsuario,
                'comentario'   => $comentario,
            ]);
            $db->transCommit();
        } catch (\Throwable $e) {
            $db->transRollback();
            throw $e;
        }
    }

    /**
     * Impide registrar dos solicitudes del mismo servidor con fechas y horas que se crucen.
     * Las licencias por días bloquean cualquier permiso por horas dentro de esas fechas.
     */
    public function validarCruceHorario(int $idServidor, array $datos, ?int $excluirId = null): void
    {
        $fechaInicio = $datos['fecha_inicio'] ?? null;
        $fechaFin    = $datos['fecha_fin'] ?? $fechaInicio;
        $idTipo      = (int) ($datos['id_tipo'] ?? 0);

        if (empty($fechaInicio) || empty($fechaFin) || $idTipo <= 0) {
            return;
        }

        $tipoNuevo = db_connect()->table('permiso_tipo_solicitud')
            ->where('id_tipo', $idTipo)
            ->get()->getRowArray();
        if (! $tipoNuevo) {
            return;
        }

        $esHorasNuevo = ($tipoNuevo['unidad_medida'] ?? '') === 'HORAS';
        $nuevoInicio  = $esHorasNuevo ? $this->minutos($datos['hora_inicio'] ?? null) : null;
        $nuevoFin     = $esHorasNuevo ? $this->minutos($datos['hora_fin'] ?? null) : null;

        // Si todavía no tiene horas completas, el control de horas se hará al enviar.
        if ($esHorasNuevo && ($nuevoInicio === null || $nuevoFin === null)) {
            return;
        }

        $b = db_connect()->table('permiso_solicitud_papeleta s')
            ->select('s.id_solicitud, s.nro_solicitud, s.fecha_inicio, s.fecha_fin,
                      s.hora_inicio, s.hora_fin, t.unidad_medida')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->where('s.id_servidor', $idServidor)
            ->whereIn('s.estado', [
                'PENDIENTE', 'OBSERVADA', 'APROBADA_JEFE', 'APROBADA_RRHH',
                'REGULARIZAR', 'EN_CURSO', 'EJECUTADA',
            ])
            ->where('s.fecha_inicio <=', $fechaFin)
            ->where('s.fecha_fin >=', $fechaInicio);

        if ($excluirId !== null) {
            $b->where('s.id_solicitud !=', $excluirId);
        }

        $solicitudes = $b->get()->getResultArray();

        foreach ($solicitudes as $solicitud) {
            $conflicto = true;

            if ($esHorasNuevo) {
                $esHorasExistente = ($solicitud['unidad_medida'] ?? '') === 'HORAS';
                if ($esHorasExistente) {
                    $existenteInicio = $this->minutos($solicitud['hora_inicio'] ?? null);
                    $existenteFin    = $this->minutos($solicitud['hora_fin'] ?? null);

                    $conflicto = $existenteInicio === null
                        || $existenteFin === null
                        || $this->rangosSeCruzan($nuevoInicio, $nuevoFin, $existenteInicio, $existenteFin);
                }
            }

            if (! $conflicto) {
                continue;
            }

            $detalle = $this->detalleCruce($solicitud);
            throw new \RuntimeException(
                'Ya tiene una solicitud que se cruza en ese horario: '
                . $solicitud['nro_solicitud'] . $detalle . '.'
            );
        }
    }

    private function minutos(?string $hora): ?int
    {
        if ($hora === null || $hora === '') {
            return null;
        }

        $partes = explode(':', substr($hora, 0, 5));
        if (count($partes) < 2) {
            return null;
        }

        $h = (int) $partes[0];
        $m = (int) $partes[1];
        if ($h < 0 || $h > 23 || $m < 0 || $m > 59) {
            return null;
        }

        return $h * 60 + $m;
    }

    private function rangosSeCruzan(int $inicioA, int $finA, int $inicioB, int $finB): bool
    {
        if ($finA <= $inicioA) $finA += 24 * 60;
        if ($finB <= $inicioB) $finB += 24 * 60;

        return ($inicioA < $finB && $finA > $inicioB)
            || ($inicioA + 24 * 60 < $finB && $finA + 24 * 60 > $inicioB);
    }

    private function detalleCruce(array $s): string
    {
        $inicio = substr((string) ($s['hora_inicio'] ?? ''), 0, 5);
        $fin    = substr((string) ($s['hora_fin'] ?? ''), 0, 5);

        if ($inicio !== '' && $fin !== '') {
            return ' (' . $inicio . ' - ' . $fin . ')';
        }

        return ' (' . $s['fecha_inicio'] . ' al ' . $s['fecha_fin'] . ')';
    }

    public function consumirSaldo(int $idSolicitud): void
    {
        $s = $this->solicitudes->find($idSolicitud);
        if (! $s || empty($s['fecha_inicio'])) return;
        $anio = (int) substr((string) $s['fecha_inicio'], 0, 4);
        $this->saldos->consumir((int) $s['id_servidor'], (int) $s['id_tipo'], $anio, (float) $s['cantidad']);
    }

    public function contarAdjuntos(int $idSolicitud): int
    {
        return db_connect()->table('permiso_solicitud_adjunto')
            ->where('id_solicitud', $idSolicitud)
            ->countAllResults();
    }

    public function insertarAdjuntos(int $idSolicitud, array $archivos): void
    {
        if ($archivos === []) return;

        $this->adjuntos->insertBatch(array_map(fn ($a) => [
            'id_solicitud' => $idSolicitud,
            'nombre_arch'  => $a['nombre'],
            'ruta_arch'    => $a['ruta'],
            'mime'         => $a['mime'],
            'tamano_bytes' => $a['tamano'],
            'confidencial' => $a['confidencial'] ? 1 : 0,
        ], $archivos));
    }

    private function servidor(int $idServidor): array
    {
        $sv = db_connect()->table('permiso_servidor')
            ->where('id_servidor', $idServidor)
            ->get()->getRowArray();

        if (! $sv) throw new \RuntimeException('Servidor no encontrado.');
        return $sv;
    }

    private function snapshots(array $servidor): array
    {
        return [
            'id_jefe_solicitud'   => $servidor['id_jefe'] !== null ? (int) $servidor['id_jefe'] : null,
            'id_unidad_solicitud' => (int) $servidor['id_unidad'],
            'id_cargo_solicitud'  => $servidor['id_cargo'] !== null ? (int) $servidor['id_cargo'] : null,
        ];
    }

    private function nuevoNro(\CodeIgniter\Database\BaseConnection $db): string
    {
        $anio = (int) date('Y');
        $db->query('INSERT INTO permiso_contador (anio, seq) VALUES (?, 0)
                    ON DUPLICATE KEY UPDATE seq = seq', [$anio]);
        $db->query('UPDATE permiso_contador SET seq = seq + 1 WHERE anio = ?', [$anio]);
        $row = $db->query('SELECT seq FROM permiso_contador WHERE anio = ?', [$anio])->getRowArray();
        return sprintf('%d-%06d', $anio, (int) $row['seq']);
    }
}
