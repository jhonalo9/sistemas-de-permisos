<?php

namespace App\Filters;

use App\Libraries\AuthContext;
use App\Libraries\JwtService;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class JwtFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        AuthContext::clear();

        $auth = $request->getHeaderLine('Authorization');
        if (! preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
            return service('response')->setStatusCode(401)
                ->setJSON(['mensaje' => 'Falta el token de autenticación.']);
        }

        $payload = JwtService::validar($m[1]);
        if ($payload === null) {
            return service('response')->setStatusCode(401)
                ->setJSON(['mensaje' => 'Token inválido o vencido.']);
        }

        // ✅ en lugar de $request->usuario = $payload;
        AuthContext::$usuario = is_array($payload)
            ? $payload
            : (array) $payload;

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}