<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Models\SolicitudModel;
use App\Services\SolicitudService;

class GerenciaController extends BaseApiController
{
    public function pendientes()
    {
        $rows = db_connect()->table('permiso_solicitud_papeleta s')
            ->select('s.id_solicitud, s.nro_solicitud, s.fecha_inicio, s.fecha_fin,
                      s.cantidad, s.estado, s.motivo, s.nro_resolucion, s.fecha_resolucion,
                      s.creado_en, t.nombre AS tipo_nombre, t.categoria,
                      u.nombre AS unidad, CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor,
                      sv.dni')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->join('permiso_servidor sv', 'sv.id_servidor = s.id_servidor')
            ->join('permiso_unidad_organica u', 'u.id_unidad = COALESCE(s.id_unidad_solicitud, sv.id_unidad)')
            ->where('s.estado', 'PENDIENTE_GERENCIA')
            ->orderBy('s.creado_en', 'ASC')
            ->get()->getResultArray();

        return ApiResponse::ok($rows);
    }

    public function detalle(int $id)
    {
        $s = (new SolicitudModel())->detalleCompleto($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        return ApiResponse::ok($s);
    }

    public function aprobar(int $id)
    {
        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'PENDIENTE_GERENCIA') {
            return ApiResponse::error('La solicitud no está pendiente de Gerencia.', 422);
        }

        $d = $this->datos();
        $extra = [];
        if (! empty($d['nro_resolucion'])) $extra['nro_resolucion'] = $d['nro_resolucion'];
        if (! empty($d['fecha_resolucion'])) $extra['fecha_resolucion'] = $d['fecha_resolucion'];

        $svc = new SolicitudService();
        $svc->cambiarEstado($id, 'APROBADA_RRHH', $this->idUsuario(),
            'Aprobada por Gerencia.', $extra);
        $svc->consumirSaldo($id);

        $tipo = db_connect()->table('permiso_tipo_solicitud')
            ->where('id_tipo', $s['id_tipo'])->get()->getRowArray();
        $token = $s['token_codigo'] ?? null;
        if ($tipo && ($tipo['unidad_medida'] === 'HORAS' || $tipo['codigo'] === 'PER_COMISION_SERVICIO') && empty($token)) {
            $token = strtoupper(bin2hex(random_bytes(8)));
            db_connect()->table('permiso_solicitud_papeleta')
                ->where('id_solicitud', $id)
                ->update(['token_codigo' => $token]);
        }

        return ApiResponse::ok(null, 200, [
            'mensaje' => 'Solicitud aprobada por Gerencia.',
            'token_codigo' => $token,
        ]);
    }

    public function rechazar(int $id)
    {
        $d = $this->datos();
        if (empty($d['motivo'])) return ApiResponse::error('Indique el motivo del rechazo.', 422);

        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'PENDIENTE_GERENCIA') {
            return ApiResponse::error('La solicitud no está pendiente de Gerencia.', 422);
        }

        (new SolicitudService())->cambiarEstado($id, 'RECHAZADA', $this->idUsuario(), $d['motivo']);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Solicitud rechazada por Gerencia.']);
    }
}
