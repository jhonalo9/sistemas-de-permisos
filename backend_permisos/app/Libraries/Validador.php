<?php

namespace App\Libraries;

use CodeIgniter\HTTP\IncomingRequest;

class Validador
{
    /** Valida reglas CI sobre los datos del request y devuelve errores o null. */
    public static function validar(IncomingRequest $request, array $reglas): ?array
    {
        $datos = self::datos($request);
        $v = service('validation');
        $v->setRules($reglas);
        if (! $v->run($datos)) {
            return $v->getErrors();
        }
        return null;
    }

    /** Normaliza entrada JSON o form-data a array asociativo. */
    public static function datos(IncomingRequest $request): array
    {
        $ct = $request->getHeaderLine('Content-Type');
        if (str_contains($ct, 'application/json')) {
            try {
                return (array) ($request->getJSON(true) ?? []);
            } catch (\Throwable) {
                return [];
            }
        }
        return (array) $request->getPost();
    }

    public static function int(IncomingRequest $request, string $campo, ?int $def = null): ?int
    {
        $d = self::datos($request);
        $v = $d[$campo] ?? $def;
        return $v === null ? null : (int) $v;
    }
}