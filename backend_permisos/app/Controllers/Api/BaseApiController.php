<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthContext;

abstract class BaseApiController extends BaseController
{
    /** Payload JWT del request actual. */
    protected function usuario(): array
    {
        return AuthContext::$usuario ?? [];
    }

    protected function idUsuario(): int
    {
        return (int) ($this->usuario()['sub'] ?? 0);
    }

    protected function idServidor(): ?int
    {
        $id = $this->usuario()['id_servidor'] ?? null;
        return $id === null ? null : (int) $id;
    }

    protected function roles(): array
    {
        return $this->usuario()['roles'] ?? [];
    }

    protected function tieneRol(string ...$roles): bool
    {
        return (bool) array_intersect($roles, $this->roles());
    }

    protected function datos(): array
    {
        return \App\Libraries\Validador::datos($this->request);
    }

    protected function paginar(): array
    {
        $page    = max(1, (int) ($this->request->getGet('page') ?? 1));
        $perPage = min(100, max(5, (int) ($this->request->getGet('per_page') ?? 20)));
        return [
            'page'     => $page,
            'per_page' => $perPage,
            'offset'   => ($page - 1) * $perPage,
        ];
    }
}