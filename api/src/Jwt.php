<?php

declare(strict_types=1);

namespace App;

final class Jwt
{
    public static function encode(array $payload, string $secret, int $ttlSeconds): string
    {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $now = time();

        $payload['iat'] = $payload['iat'] ?? $now;
        $payload['exp'] = $payload['exp'] ?? ($now + $ttlSeconds);

        $segments = [
            self::b64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES) ?: '{}'),
            self::b64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES) ?: '{}'),
        ];

        $signingInput = implode('.', $segments);
        $signature = hash_hmac('sha256', $signingInput, $secret, true);
        $segments[] = self::b64UrlEncode($signature);

        return implode('.', $segments);
    }

    public static function decode(string $jwt, string $secret): ?array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return null;
        }

        [$h64, $p64, $s64] = $parts;

        $header = json_decode(self::b64UrlDecode($h64), true);
        $payload = json_decode(self::b64UrlDecode($p64), true);
        $sig = self::b64UrlDecode($s64);

        if (!is_array($header) || !is_array($payload)) {
            return null;
        }
        if (($header['alg'] ?? null) !== 'HS256') {
            return null;
        }

        $expected = hash_hmac('sha256', $h64 . '.' . $p64, $secret, true);
        if (!hash_equals($expected, $sig)) {
            return null;
        }

        $exp = $payload['exp'] ?? null;
        if (is_int($exp) && time() > $exp) {
            return null;
        }

        return $payload;
    }

    private static function b64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        $decoded = base64_decode(strtr($data, '-_', '+/'), true);
        return $decoded === false ? '' : $decoded;
    }
}
