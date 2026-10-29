<?php

namespace App\Libraries;

use CodeIgniter\HTTP\ResponseInterface;

class ApiResponse
{
    public static function ok(mixed $data = null, int $code = 200, array $extra = []): ResponseInterface
    {
        $body = array_merge(['ok' => true], $extra);
        if ($data !== null) $body['data'] = $data;
        return service('response')->setStatusCode($code)->setJSON($body);
    }

    public static function error(string $mensaje, int $code = 400, ?int $codigoError = null): ResponseInterface
    {
        $body = ['ok' => false, 'mensaje' => $mensaje];
        if ($codigoError !== null) $body['codigo_error'] = $codigoError;
        return service('response')->setStatusCode($code)->setJSON($body);
    }
}