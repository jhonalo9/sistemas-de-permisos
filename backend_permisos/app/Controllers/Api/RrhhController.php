<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Models\SolicitudModel;
use App\Services\SolicitudService;

class RrhhController extends BaseApiController
{
    public function panel()
    {
        $db = db_connect();
        return ApiResponse::ok([
            'pendientes_validar'  => (int) $db->table('permiso_solicitud_papeleta')->where('estado', 'APROBADA_JEFE')->countAllResults(),
            'emergencias'         => (int) $db->table('permiso_solicitud_papeleta')->where('estado', 'REGULARIZAR')->countAllResults(),
            'vencidas'            => (int) $db->table('permiso_solicitud_papeleta')
                ->where('estado', 'REGULARIZAR')->where('fecha_limite_regularizacion <', date('Y-m-d'))->countAllResults(),
            'personal_fuera'      => (int) $db->table('vw_personal_fuera')->countAllResults(),
            'solicitudes_mes'     => (int) $db->table('permiso_solicitud_papeleta')
                ->where('YEAR(creado_en)', date('Y'))->where('MONTH(creado_en)', date('m'))->countAllResults(),
        ]);
    }

    public function bandeja()
    {
        $db = db_connect();
        $p = $this->paginar();
        $b = $db->table('permiso_solicitud_papeleta s')
            ->select('s.id_solicitud, s.nro_solicitud, s.estado, s.fecha_inicio, s.fecha_fin,
                      s.cantidad, s.es_urgente, s.creado_en, s.id_tipo,
                      t.nombre AS tipo_nombre, t.categoria, t.unidad_medida,
                      CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor, sv.dni,
                      COALESCE(s.id_unidad_solicitud, sv.id_unidad) AS id_unidad,
                      c.nombre AS cargo, u.nombre AS unidad')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->join('permiso_servidor sv', 'sv.id_servidor = s.id_servidor')
            ->join('permiso_cargo c', 'c.id_cargo = COALESCE(s.id_cargo_solicitud, sv.id_cargo)', 'left')
            ->join('permiso_unidad_organica u', 'u.id_unidad = COALESCE(s.id_unidad_solicitud, sv.id_unidad)')
            ->orderBy('s.creado_en', 'ASC');

        $estado = $this->request->getGet('estado') ?: 'APROBADA_JEFE';
        $b->where('s.estado', $estado);
        if ($tipo   = $this->request->getGet('id_tipo'))  $b->where('s.id_tipo', (int) $tipo);
        if ($unidad = $this->request->getGet('id_unidad')) {
            $b->where(new \CodeIgniter\Database\RawSql(
                'COALESCE(s.id_unidad_solicitud, sv.id_unidad) = ' . (int) $unidad
            ));
        }
        if ($desde  = $this->request->getGet('fecha_desde')) $b->where('s.fecha_inicio >=', $desde);
        if ($hasta  = $this->request->getGet('fecha_hasta')) $b->where('s.fecha_inicio <=', $hasta);

        $total = (clone $b)->countAllResults(false);
        $items = $b->limit($p['per_page'], $p['offset'])->get()->getResultArray();
        return ApiResponse::ok($items, 200, ['total' => $total, 'page' => $p['page'], 'per_page' => $p['per_page']]);
    }

    public function detalle(int $id)
    {
        $s = (new SolicitudModel())->detalleCompleto($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        $s['servidor']['saldo'] = $this->saldoDe($s);
        return ApiResponse::ok($s);
    }

    public function validar(int $id)
    {
        $d = $this->datos();
        if (empty($d['nro_resolucion']) || empty($d['fecha_resolucion'])) {
            return ApiResponse::error('Ingrese N.º y fecha de resolución.', 422);
        }

        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'APROBADA_JEFE') {
            return ApiResponse::error('La solicitud no está pendiente de validación por RRHH.', 422);
        }

        $tipo = db_connect()->table('permiso_tipo_solicitud')
            ->where('id_tipo', $s['id_tipo'])
            ->get()->getRowArray();
        if (! $tipo) return ApiResponse::error('Tipo de solicitud no encontrado.', 422);
        if ($tipo['codigo'] === 'PER_EMERGENCIA') {
            return ApiResponse::error('La salida de emergencia debe completarse desde Regularización antes de la validación de RRHH.', 422);
        }

        $saldo = $this->saldoDe($s);
        if ($saldo !== null && $saldo['disponible'] < (float) $s['cantidad']) {
            return ApiResponse::error('Saldo insuficiente: disponible ' . $saldo['disponible'] . ', requerido ' . $s['cantidad'] . '.', 422);
        }

        $svc = new SolicitudService();
        $svc->cambiarEstado($id, 'APROBADA_RRHH', $this->idUsuario(), 'Aprobada por RRHH.', [
            'nro_resolucion'   => $d['nro_resolucion'],
            'fecha_resolucion' => $d['fecha_resolucion'],
        ]);
        $svc->consumirSaldo($id);

        $token = $s['token_codigo'] ?? null;
        if ($tipo && $tipo['unidad_medida'] === 'HORAS' && empty($token)) {
            $token = strtoupper(bin2hex(random_bytes(8)));
            db_connect()->table('permiso_solicitud_papeleta')
                ->where('id_solicitud', $id)
                ->update(['token_codigo' => $token]);
        }

        return ApiResponse::ok(null, 200, [
            'mensaje'       => 'Solicitud validada.',
            'token_codigo'  => $token,
            'unidad_medida' => $tipo['unidad_medida'] ?? null,
        ]);
    }

    public function observar(int $id)
    {
        $d = $this->datos();
        if (empty($d['comentario'])) return ApiResponse::error('Indique el motivo de la observación.', 422);

        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'APROBADA_JEFE') return ApiResponse::error('La solicitud no está pendiente de validación.', 422);

        (new SolicitudService())->cambiarEstado($id, 'OBSERVADA', $this->idUsuario(), $d['comentario']);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Solicitud observada.']);
    }

    public function rechazar(int $id)
    {
        $d = $this->datos();
        if (empty($d['motivo'])) return ApiResponse::error('Indique el motivo del rechazo.', 422);

        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'APROBADA_JEFE') return ApiResponse::error('La solicitud no está pendiente de validación.', 422);

        (new SolicitudService())->cambiarEstado($id, 'RECHAZADA', $this->idUsuario(), $d['motivo']);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Solicitud rechazada.']);
    }

    public function generarToken(int $id)
    {
        $db = db_connect();
        $s = $db->table('permiso_solicitud_papeleta')->where('id_solicitud', $id)->get()->getRowArray();
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'APROBADA_RRHH') return ApiResponse::error('Solo se genera token de una papeleta aprobada.', 422);

        $token = strtoupper(bin2hex(random_bytes(8)));   // 16 hex chars
        $db->table('permiso_solicitud_papeleta')->where('id_solicitud', $id)->update(['token_codigo' => $token]);
        return ApiResponse::ok(['nro_solicitud' => $s['nro_solicitud'], 'token_codigo' => $token]);
    }

    public function papeletaPdf(int $id)
    {
        $s = db_connect()->table('permiso_solicitud_papeleta s')
            ->select('s.estado, t.unidad_medida')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->where('s.id_solicitud', $id)
            ->get()->getRowArray();

        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ($s['estado'] !== 'APROBADA_RRHH') {
            return ApiResponse::error('Solo se genera papeleta de una solicitud aprobada por RRHH.', 422);
        }
        if ($s['unidad_medida'] !== 'HORAS') {
            return ApiResponse::error('La papeleta solo aplica a permisos por horas.', 422);
        }

        $pdf = (new \App\Libraries\PapeletaPdf())->generar($id);
        if (! $pdf) return ApiResponse::error('No se pudo generar la papeleta.', 500);
        return service('response')
            ->setHeader('Content-Type', 'application/pdf')
            ->setHeader('Content-Disposition', 'inline; filename="papeleta-' . $id . '.pdf"')
            ->setBody($pdf);
    }

    public function regularizaciones()
    {
        $rows = db_connect()->query('SELECT * FROM vw_regularizaciones_pendientes ORDER BY vencida DESC, dias_restantes ASC')->getResultArray();
        return ApiResponse::ok($rows);
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
}