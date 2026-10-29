<?php

namespace App\Libraries;

class AuthContext
{
    /** @var array|null Payload JWT del usuario autenticado */
    public static ?array $usuario = null;

    public static function clear(): void
    {
        self::$usuario = null;
    }
}