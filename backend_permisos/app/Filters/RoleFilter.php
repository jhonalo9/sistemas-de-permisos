<?php

namespace App\Filters;

use App\Libraries\AuthContext;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class RoleFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $usuario = AuthContext::$usuario;

        if (! $usuario) {
            return service('response')->setStatusCode(401)
                ->setJSON(['mensaje' => 'No autenticado.']);
        }

        $permitidos = is_array($arguments) ? $arguments : explode(',', (string) ($arguments ?? ''));
        $permitidos = array_values(array_filter(array_map('trim', $permitidos)));
        $rolesUsuario = $usuario['roles'] ?? [];

        if (empty(array_intersect($rolesUsuario, $permitidos))) {
            return service('response')->setStatusCode(403)
                ->setJSON(['mensaje' => 'No tiene permiso para esta acción.']);
        }

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}