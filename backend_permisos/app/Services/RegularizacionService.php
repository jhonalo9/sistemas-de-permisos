<?php

namespace App\Services;

use App\Models\SolicitudModel;
use App\Models\HistorialModel;
use App\Models\TipoSolicitudModel;

class RegularizacionService
{
    public function __construct(
        private readonly SolicitudModel     $solicitudes = new SolicitudModel(),
        private readonly HistorialModel     $historial   = new HistorialModel(),
        private readonly TipoSolicitudModel $tipos       = new TipoSolicitudModel(),
    ) {}

    public function registrarEmergencia(array $d, int $idUsuario): array
    {
        $db = db_connect();
        $db->transBegin();
        try {
            $tipo = $this->tipos->where('codigo', 'PER_EMERGENCIA')->first();
            if (! $tipo) throw new \RuntimeException('Falta el tipo PER_EMERGENCIA en el catálogo.');

            $fechaSalida = trim((string) ($d['fecha_salida'] ?? date('Y-m-d')));
            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaSalida) || strtotime($fechaSalida) === false) {
                throw new \RuntimeException('La fecha de salida no es válida.');
            }
            if ($fechaSalida > date('Y-m-d')) {
                throw new \RuntimeException('La fecha de salida no puede ser futura.');
            }

            $horaSalida = trim((string) ($d['hora_salida'] ?? date('H:i:s')));
            if (preg_match('/^\d{2}:\d{2}$/', $horaSalida)) {
                $horaSalida .= ':00';
            }
            if (! preg_match('/^\d{2}:\d{2}:\d{2}$/', $horaSalida)) {
                throw new \RuntimeException('La hora de salida no es válida.');
            }
            [$hh, $mm, $ss] = array_map('intval', explode(':', $horaSalida));
            if ($hh > 23 || $mm > 59 || $ss > 59) {
                throw new \RuntimeException('La hora de salida no es válida.');
            }

            $plazo = (int) ($tipo['plazo_regularizacion_dias'] ?? 5);
            $limite = date('Y-m-d', strtotime("+$plazo days", strtotime($fechaSalida)));

            $sv = $this->servidor((int) $d['id_servidor']);
            $snapshots = [
                'id_jefe_solicitud'   => $sv['id_jefe'] !== null ? (int) $sv['id_jefe'] : null,
                'id_unidad_solicitud' => (int) $sv['id_unidad'],
                'id_cargo_solicitud'  => $sv['id_cargo'] !== null ? (int) $sv['id_cargo'] : null,
            ];

            $nro = $this->nuevoNro($db);
            $id = $this->solicitudes->insert(array_merge([
                'nro_solicitud'               => $nro,
                'id_servidor'                 => (int) $d['id_servidor'],
                'id_tipo'                     => (int) $tipo['id_tipo'],
                'fecha_inicio'                => $fechaSalida,
                'fecha_fin'                   => $fechaSalida,
                'hora_inicio'                 => $horaSalida,
                'cantidad'                    => 0,
                'motivo'                      => $d['motivo'],
                'estado'                      => 'REGULARIZAR',
                'es_urgente'                  => 1,
                'fecha_limite_regularizacion' => $limite,
            ], $snapshots), true);

            $db->table('permiso_marcacion_control')->insert([
                'id_solicitud'       => $id,
                'tipo'               => 'SALIDA',
                'fecha_hora'         => $fechaSalida . ' ' . $horaSalida,
                'origen'             => 'EMERGENCIA',
                'id_puesto'          => $d['id_puesto']          ?? null,
                'id_usuario_control' => $idUsuario,
                'autorizado_por'     => $d['autorizado_por']     ?? null,
                'observacion'        => $d['observacion']        ?? $d['motivo'],
            ]);
            $this->historial->insert([
                'id_solicitud' => $id, 'estado_ant' => null, 'estado_new' => 'REGULARIZAR',
                'id_usuario' => $idUsuario, 'comentario' => 'Salida de emergencia registrada.',
            ]);
            $db->transCommit();
            return [
                'id_solicitud'                => $id,
                'nro_solicitud'               => $nro,
                'fecha_salida'                => $fechaSalida,
                'hora_salida'                 => $horaSalida,
                'fecha_limite_regularizacion' => $limite,
                'estado'                      => 'REGULARIZAR',
            ];
        } catch (\Throwable $e) {
            $db->transRollback();
            throw $e;
        }
    }

    public function completar(int $idSolicitud, array $d, int $idUsuario, array $archivos = []): void
    {
        $s = $this->solicitudes->find($idSolicitud);
        if (! $s) throw new \RuntimeException('Solicitud no encontrada.');
        if ((int) $s['es_urgente'] !== 1 || $s['estado'] !== 'REGULARIZAR') {
            throw new \RuntimeException('Solo se completan regularizaciones en estado REGULARIZAR.');
        }

        $idTipo = (int) ($d['id_tipo'] ?? $s['id_tipo']);
        $tipo   = $this->tipos->find($idTipo);
        if (! $tipo || ! $tipo['activo']) {
            throw new \RuntimeException('Tipo de solicitud no válido.');
        }
        if ($tipo['codigo'] === 'PER_EMERGENCIA') {
            throw new \RuntimeException('Seleccione un tipo definitivo distinto de emergencia.');
        }

        $fechaInicio = $d['fecha_inicio'] ?? $s['fecha_inicio'];
        $fechaFin    = $d['fecha_fin'] ?? $fechaInicio;
        $cantidad    = isset($d['cantidad']) ? (float) $d['cantidad'] : (float) $s['cantidad'];
        $motivo      = $d['motivo'] ?? $s['motivo'];

        if (empty($fechaInicio) || empty($fechaFin)) {
            throw new \RuntimeException('Debe indicar las fechas de la regularización.');
        }
        if (empty($motivo) || strlen(trim((string) $motivo)) < 5) {
            throw new \RuntimeException('El motivo debe tener al menos 5 caracteres.');
        }
        if ($cantidad <= 0) {
            throw new \RuntimeException('La cantidad debe ser mayor que cero.');
        }

        $svc = new SolicitudService();
        if (! empty($tipo['requiere_sustento']) && $archivos === [] && $svc->contarAdjuntos($idSolicitud) < 1) {
            throw new \RuntimeException('Debe adjuntar el documento de sustento.');
        }

        $sv = $this->servidor((int) $s['id_servidor']);
        if (empty($sv['id_jefe'])) {
            throw new \RuntimeException('El servidor no tiene jefe inmediato asignado.');
        }

        $db = db_connect();
        $db->transBegin();
        try {
            $this->solicitudes->update($idSolicitud, [
                'id_tipo'             => $idTipo,
                'id_jefe_solicitud'   => (int) $sv['id_jefe'],
                'id_unidad_solicitud' => (int) $sv['id_unidad'],
                'id_cargo_solicitud'  => $sv['id_cargo'] !== null ? (int) $sv['id_cargo'] : null,
                'fecha_inicio'        => $fechaInicio,
                'fecha_fin'           => $fechaFin,
                'hora_inicio'         => $d['hora_inicio'] ?? $s['hora_inicio'],
                'hora_fin'            => $d['hora_fin']    ?? $s['hora_fin'],
                'cantidad'            => $cantidad,
                'motivo'              => $motivo,
                'estado'              => 'PENDIENTE',
            ]);
            $svc->insertarAdjuntos($idSolicitud, $archivos);
            $this->historial->insert([
                'id_solicitud' => $idSolicitud, 'estado_ant' => 'REGULARIZAR',
                'estado_new' => 'PENDIENTE', 'id_usuario' => $idUsuario,
                'comentario' => 'Regularización completada; pasa a flujo normal.',
            ]);
            $db->transCommit();
        } catch (\Throwable $e) {
            $db->transRollback();
            throw $e;
        }
    }

    private function servidor(int $idServidor): array
    {
        $sv = db_connect()->table('permiso_servidor')
            ->where('id_servidor', $idServidor)
            ->get()->getRowArray();
        if (! $sv) throw new \RuntimeException('Servidor no encontrado.');
        return $sv;
    }

    private function nuevoNro(\CodeIgniter\Database\BaseConnection $db): string
    {
        $anio = (int) date('Y');
        $db->query('INSERT INTO permiso_contador (anio, seq) VALUES (?, 0)
                    ON DUPLICATE KEY UPDATE seq = seq', [$anio]);
        $db->query('UPDATE permiso_contador SET seq = seq + 1 WHERE anio = ?', [$anio]);
        $seq = (int) $db->query('SELECT seq FROM permiso_contador WHERE anio = ?', [$anio])->getRow()->seq;
        return sprintf('%d-%06d', $anio, $seq);
    }
}