<?php

declare(strict_types=1);

namespace App;

final class Request
{
    public static function method(): string
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? null;
        if ($override !== null) {
            return strtoupper($override);
        }

        return $method;
    }

    public static function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);
        if (!is_string($path)) {
            return '/';
        }

        if (str_starts_with($path, '/api')) {
            $path = substr($path, 4);
            if ($path === '') {
                $path = '/';
            }
        }

        return rtrim($path, '/') ?: '/';
    }

    public static function query(string $key, ?string $default = null): ?string
    {
        if (!isset($_GET[$key])) {
            return $default;
        }

        $val = $_GET[$key];
        if (is_string($val)) {
            return $val;
        }

        return $default;
    }

    public static function json(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        return $decoded;
    }

    public static function authHeader(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        if ($header === null) {
            return null;
        }
        return trim($header);
    }
}
