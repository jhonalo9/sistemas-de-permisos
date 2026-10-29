<?php

namespace App\Libraries;

class JwtService
{
    private static function secret(): string
    {
        $s = env('JWT_SECRET', '');
        if (strlen($s) < 32) {
            throw new \RuntimeException('JWT_SECRET debe tener al menos 32 caracteres.');
        }
        return $s;
    }

    public static function generar(array $payload): string
    {
        $header = self::b64(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + (int) env('JWT_TTL', 28800);
        $body = self::b64(json_encode($payload));
        $sig  = self::b64(hash_hmac('sha256', "$header.$body", self::secret(), true));
        return "$header.$body.$sig";
    }

    public static function validar(string $jwt): ?array
    {
        $partes = explode('.', $jwt);
        if (count($partes) !== 3) return null;

        [$header, $body, $sig] = $partes;
        $esperada = self::b64(hash_hmac('sha256', "$header.$body", self::secret(), true));
        if (! hash_equals($esperada, $sig)) return null;

        $payload = json_decode(self::unb64($body), true);
        if (! is_array($payload) || ($payload['exp'] ?? 0) < time()) return null;

        return $payload;
    }

    private static function b64(string $s): string
    {
        return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
    }

    private static function unb64(string $s): string
    {
        return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4));
    }
}