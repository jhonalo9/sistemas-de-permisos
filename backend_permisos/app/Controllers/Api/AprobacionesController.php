<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Models\SolicitudModel;
use App\Services\SolicitudService;

class AprobacionesController extends BaseApiController
{
    public function pendientes()
    {
        $p = $this->paginar();
        $res = (new SolicitudModel())->aprobadasDelEquipo((int) $this->idServidor(), $p['offset'], $p['per_page']);
        return ApiResponse::ok($res['items'], 200, ['total' => $res['total'], 'page' => $p['page'], 'per_page' => $p['per_page']]);
    }

    public function detalle(int $id)
    {
        $s = (new SolicitudModel())->detalleCompleto($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if (! $this->puedeGestionar($s)) return ApiResponse::error('No autorizado.', 403);

        $s['servidor']['saldo'] = $this->saldoDe($s);
        $equipo = $this->calendarioEquipo($s);
        return ApiResponse::ok(['solicitud' => $s, 'equipo_ausente' => $equipo]);
    }

    public function aprobar(int $id)
    {
        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'PENDIENTE') return ApiResponse::error('Solicitud no está pendiente.', 422);
        if (! $this->puedeGestionar($s)) return ApiResponse::error('No autorizado.', 403);

        (new SolicitudService())->cambiarEstado($id, 'APROBADA_JEFE', $this->idUsuario(), 'Aprobada por jefe inmediato.');
        return ApiResponse::ok(null, 200, ['mensaje' => 'Aprobada.']);
    }

    public function observar(int $id)
    {
        $d = $this->datos();
        if (empty($d['comentario'])) return ApiResponse::error('Debe indicar el motivo de la observación.', 422);

        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'PENDIENTE') return ApiResponse::error('Solicitud no está pendiente.', 422);
        if (! $this->puedeGestionar($s)) return ApiResponse::error('No autorizado.', 403);

        (new SolicitudService())->cambiarEstado($id, 'OBSERVADA', $this->idUsuario(), $d['comentario']);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Solicitud observada.']);
    }

    public function rechazar(int $id)
    {
        $d = $this->datos();
        if (empty($d['motivo'])) return ApiResponse::error('Debe indicar el motivo del rechazo.', 422);

        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'PENDIENTE') return ApiResponse::error('Solicitud no está pendiente.', 422);
        if (! $this->puedeGestionar($s)) return ApiResponse::error('No autorizado.', 403);

        (new SolicitudService())->cambiarEstado($id, 'RECHAZADA', $this->idUsuario(), $d['motivo']);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Solicitud rechazada.']);
    }

    public function miEquipo()
    {
        $db = db_connect();
        $idJefe = (int) $this->idServidor();
        return ApiResponse::ok([
            'fuera' => $db->table('vw_personal_fuera f')
                ->select('f.id_solicitud, f.nro_solicitud, f.servidor, f.unidad,
                          f.hora_salida, f.hora_retorno, f.minutos_fuera, f.es_urgente')
                ->join('permiso_servidor sv', 'sv.id_servidor = f.id_servidor')
                ->where('sv.id_jefe', $idJefe)
                ->get()->getResultArray(),
            'programados' => $db->table('permiso_solicitud_papeleta s')
                ->select('s.nro_solicitud, s.fecha_inicio, s.fecha_fin, s.hora_inicio, s.hora_fin,
                          s.cantidad, t.nombre AS tipo_nombre, t.unidad_medida,
                          CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor')
                ->join('permiso_servidor sv', 'sv.id_servidor = s.id_servidor')
                ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
                ->where('sv.id_jefe', $idJefe)
                ->whereIn('s.estado', ['APROBADA_JEFE', 'APROBADA_RRHH'])
                ->where('s.fecha_fin >=', date('Y-m-d'))
                ->orderBy('s.fecha_inicio')
                ->get()->getResultArray(),
        ]);
    }

    private function calendarioEquipo(array $s): array
    {
        $jefeId = $s['id_jefe_solicitud'] ?? null;
        if ($jefeId === null) {
            $sv = db_connect()->table('permiso_servidor')
                ->where('id_servidor', $s['id_servidor'])
                ->get()->getRowArray();
            $jefeId = $sv['id_jefe'] ?? null;
        }

        $q = db_connect()->table('permiso_solicitud_papeleta s')
            ->select('s.nro_solicitud, s.fecha_inicio, s.fecha_fin,
                      CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor')
            ->join('permiso_servidor sv', 'sv.id_servidor = s.id_servidor')
            ->where('sv.id_servidor <>', $s['id_servidor'])
            ->whereIn('s.estado', ['APROBADA_JEFE', 'APROBADA_RRHH', 'EN_CURSO'])
            ->where('s.fecha_inicio <=', $s['fecha_fin'])
            ->where('s.fecha_fin >=', $s['fecha_inicio']);

        if ($jefeId !== null) {
            $q->where('s.id_jefe_solicitud', $jefeId);
        }

        return $q->get()->getResultArray();
    }

    private function saldoDe(array $s): ?array
    {
        if (empty($s['fecha_inicio'])) return null;
        $anio = (int) substr((string) $s['fecha_inicio'], 0, 4);
        $saldo = db_connect()->table('permiso_saldo_servidor')
            ->where([
                'id_servidor' => $s['id_servidor'],
                'id_tipo'     => $s['id_tipo'],
                'anio'        => $anio,
            ])
            ->get()->getRowArray();

        return $saldo ? [
            'asignado'   => (float) $saldo['asignado'],
            'usado'      => (float) $saldo['usado'],
            'disponible' => (float) $saldo['asignado'] - (float) $saldo['usado'],
        ] : null;
    }

    private function puedeGestionar(array $s): bool
    {
        if ($this->tieneRol('ADMIN')) return true;

        $jefeId = $s['id_jefe_solicitud'] ?? null;
        if ($jefeId === null) {
            $sv = db_connect()->table('permiso_servidor')
                ->where('id_servidor', $s['id_servidor'])
                ->get()->getRowArray();
            $jefeId = $sv['id_jefe'] ?? null;
        }

        return $jefeId !== null && (int) $jefeId === (int) $this->idServidor();
    }
}
