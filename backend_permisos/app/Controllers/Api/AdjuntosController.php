<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Models\AdjuntoModel;

class AdjuntosController extends BaseApiController
{
    public function descargar(int $idSolicitud, int $idAdjunto)
    {
        $a = (new AdjuntoModel())->find($idAdjunto);
        if (! $a || (int) $a['id_solicitud'] !== $idSolicitud) {
            return ApiResponse::error('Adjunto no encontrado.', 404);
        }

        $s = (new \App\Models\SolicitudModel())->find($idSolicitud);
        if (! $s) {
            return ApiResponse::error('Solicitud no encontrada.', 404);
        }

        if (! $this->tieneRol('RRHH', 'ADMIN')) {
            $esDueno = (int) $s['id_servidor'] === (int) $this->idServidor();
            $esJefe  = false;

            if ($this->tieneRol('JEFE')) {
                $jefeId = $s['id_jefe_solicitud'] ?? null;
                if ($jefeId === null) {
                    $sv = db_connect()->table('permiso_servidor')
                        ->where('id_servidor', $s['id_servidor'])
                        ->get()->getRowArray();
                    $jefeId = $sv['id_jefe'] ?? null;
                }
                $esJefe = $jefeId !== null && (int) $jefeId === (int) $this->idServidor();
            }

            if (! $esDueno && ! $esJefe) {
                return ApiResponse::error('No autorizado.', 403);
            }
        }

        $ruta = WRITEPATH . $a['ruta_arch'];
        if (! is_file($ruta)) return ApiResponse::error('Archivo no disponible.', 404);

        return service('response')
            ->setHeader('Content-Type', $a['mime'] ?? 'application/octet-stream')
            ->setHeader('Content-Disposition', 'inline; filename="' . $a['nombre_arch'] . '"')
            ->setBody(file_get_contents($ruta));
    }
}