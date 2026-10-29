<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Models\MarcacionModel;
use App\Services\MarcacionService;

class MarcacionesController extends BaseApiController
{
    public function registrar()
    {
        $d = $this->datos();
        if (empty($d['codigo'])) return ApiResponse::error('Falta el código de la papeleta.', 422);

        try {
            $res = (new MarcacionService())->registrar(
                $d['codigo'], (int) ($d['id_puesto'] ?? 1), $this->idUsuario(),
                $d['origen'] ?? 'LECTOR', $d['observacion'] ?? null
            );
            return ApiResponse::ok($res);
        } catch (\Throwable $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function manual()
    {
        $d = $this->datos();
        if (empty($d['codigo']))       return ApiResponse::error('Ingrese el N.º de solicitud.', 422);
        if (empty($d['observacion']))  return ApiResponse::error('La marcación manual exige observación.', 422);
        try {
            $res = (new MarcacionService())->registrar(
                $d['codigo'], (int) ($d['id_puesto'] ?? 1), $this->idUsuario(),
                'MANUAL', $d['observacion']
            );
            return ApiResponse::ok($res);
        } catch (\Throwable $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function emergencia()
    {
        $d = $this->datos();
        if (empty($d['id_servidor']) || empty($d['motivo'])) {
            return ApiResponse::error('Servidor y motivo son obligatorios.', 422);
        }
        try {
            $res = (new \App\Services\RegularizacionService())->registrarEmergencia($d, $this->idUsuario());
            return ApiResponse::ok($res, 201);
        } catch (\Throwable $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function emergencias()
    {
        $q = trim((string) $this->request->getGet('q'));

        $select = "s.id_solicitud, s.nro_solicitud, s.id_servidor,
                   s.fecha_inicio, s.hora_inicio, s.motivo, s.estado,
                   s.fecha_limite_regularizacion, s.es_urgente,
                   sv.dni, CONCAT(sv.apellidos, ', ', sv.nombres) AS servidor,
                   u.nombre AS unidad, c.nombre AS cargo,
                   t.nombre AS tipo_actual, t.codigo AS tipo_codigo,
                   (SELECT m.autorizado_por FROM permiso_marcacion_control m
                      WHERE m.id_solicitud = s.id_solicitud AND m.tipo = 'SALIDA' AND m.origen = 'EMERGENCIA'
                      ORDER BY m.id_marcacion DESC LIMIT 1) AS autorizado_por,
                   (SELECT m.observacion FROM permiso_marcacion_control m
                      WHERE m.id_solicitud = s.id_solicitud AND m.tipo = 'SALIDA' AND m.origen = 'EMERGENCIA'
                      ORDER BY m.id_marcacion DESC LIMIT 1) AS observacion,
                   (SELECT m.fecha_hora FROM permiso_marcacion_control m
                      WHERE m.id_solicitud = s.id_solicitud AND m.tipo = 'SALIDA' AND m.origen = 'EMERGENCIA'
                      ORDER BY m.id_marcacion DESC LIMIT 1) AS fecha_hora_salida";

        $b = db_connect()->table('permiso_solicitud_papeleta s')
            ->select($select, false)
            ->join('permiso_servidor sv', 'sv.id_servidor = s.id_servidor')
            ->join('permiso_unidad_organica u', 'u.id_unidad = COALESCE(s.id_unidad_solicitud, sv.id_unidad)')
            ->join('permiso_cargo c', 'c.id_cargo = COALESCE(s.id_cargo_solicitud, sv.id_cargo)', 'left')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo', 'left')
            ->where('s.es_urgente', 1);

        if ($q !== '') {
            $b->groupStart()
                ->like('sv.dni', $q)
                ->orLike('sv.apellidos', $q)
                ->orLike('sv.nombres', $q)
                ->orLike('s.nro_solicitud', $q)
                ->groupEnd();
        }

        $rows = $b->orderBy('s.fecha_inicio', 'DESC')
            ->orderBy('s.hora_inicio', 'DESC')
            ->limit(500)
            ->get()->getResultArray();

        return ApiResponse::ok($rows);
    }

    public function fueraAhora()
    {
        return ApiResponse::ok((new MarcacionModel())->fueraAhora());
    }

    public function noVolvieron()
    {
        $row = db_connect()->table('permiso_configuracion')
            ->where('clave', 'hora_corte_jornada')
            ->get()->getRowArray();
        $corte = $row['valor'] ?? '17:00';

        return ApiResponse::ok((new MarcacionModel())->noVolvieron($corte), 200, [
            'hora_corte' => $corte,
        ]);
    }

    public function buscarServidor()
    {
        $q = trim((string) $this->request->getGet('q'));
        if (strlen($q) < 2) return ApiResponse::ok([]);
        $rows = db_connect()->table('permiso_servidor sv')
            ->select('sv.id_servidor, sv.dni, sv.apellidos, sv.nombres,
                      CONCAT(sv.apellidos, ", ", sv.nombres) AS nombre, u.nombre AS unidad,
                      sv.id_jefe, j.dni AS jefe_dni,
                      CONCAT(j.apellidos, ", ", j.nombres) AS jefe_nombre')
            ->join('permiso_unidad_organica u', 'u.id_unidad = sv.id_unidad')
            ->join('permiso_servidor j', 'j.id_servidor = sv.id_jefe', 'left')
            ->groupStart()->like('sv.dni', $q)->orLike('sv.apellidos', $q)->orLike('sv.nombres', $q)->groupEnd()
            ->where('sv.estado', 'ACTIVO')
            ->limit(15)->get()->getResultArray();
        return ApiResponse::ok($rows);
    }
}