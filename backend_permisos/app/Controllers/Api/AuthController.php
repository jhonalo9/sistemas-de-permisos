<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Libraries\JwtService;
use App\Models\UsuarioModel;

class AuthController extends BaseApiController
{
    public function login()
    {
        $datos = $this->datos();
        if (empty($datos['username']) || empty($datos['password'])) {
            return ApiResponse::error('Usuario y contraseña son obligatorios.', 422);
        }

        $m = new UsuarioModel();
        $u = $m->porUsername($datos['username']);
        if (! $u || ! password_verify($datos['password'], $u['password_hash'])) {
            return ApiResponse::error('Usuario o contraseña incorrectos.', 401);
        }

        $roles = $m->rolesDe((int) $u['id_usuario']);
        if (empty($roles)) return ApiResponse::error('El usuario no tiene roles asignados.', 403);

        $token = JwtService::generar([
            'sub'         => $u['id_usuario'],
            'nombre'      => $u['nombre'],
            'username'    => $u['username'],
            'id_servidor' => $u['id_servidor'],
            'roles'       => $roles,
        ]);

        return ApiResponse::ok(null, 200, [
            'token'   => $token,
            'usuario' => [
                'id_usuario'  => (int) $u['id_usuario'],
                'nombre'      => $u['nombre'],
                'username'    => $u['username'],
                'id_servidor' => $u['id_servidor'] ? (int) $u['id_servidor'] : null,
                'roles'       => $roles,
            ],
        ]);
    }

    public function me()
    {
        return ApiResponse::ok($this->usuario());
    }

    public function logout()
    {
        // JWT es stateless: el cliente borra el token. Endpoint por simetría.
        return ApiResponse::ok(null, 200, ['mensaje' => 'Sesión cerrada.']);
    }
}