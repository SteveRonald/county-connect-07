<?php

declare(strict_types=1);

namespace App;

final class Router
{
    /** @var array<int, array{method:string, pattern:string, handler:array{0:class-string,1:string}, auth:bool}> */
    private array $routes = [];

    /** @param array{0:class-string,1:string} $handler */
    public function get(string $pattern, array $handler, bool $auth = false): void
    {
        $this->routes[] = ['method' => 'GET', 'pattern' => $pattern, 'handler' => $handler, 'auth' => $auth];
    }

    /** @param array{0:class-string,1:string} $handler */
    public function post(string $pattern, array $handler, bool $auth = false): void
    {
        $this->routes[] = ['method' => 'POST', 'pattern' => $pattern, 'handler' => $handler, 'auth' => $auth];
    }

    /** @param array{0:class-string,1:string} $handler */
    public function put(string $pattern, array $handler, bool $auth = false): void
    {
        $this->routes[] = ['method' => 'PUT', 'pattern' => $pattern, 'handler' => $handler, 'auth' => $auth];
    }

    /** @param array{0:class-string,1:string} $handler */
    public function delete(string $pattern, array $handler, bool $auth = false): void
    {
        $this->routes[] = ['method' => 'DELETE', 'pattern' => $pattern, 'handler' => $handler, 'auth' => $auth];
    }

    public function dispatch(): void
    {
        $method = Request::method();
        $path = Request::path();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->match($route['pattern'], $path);
            if ($params === null) {
                continue;
            }

            if ($route['auth']) {
                $user = Auth::requireUser();
                call_user_func($route['handler'], $params, $user);
                return;
            }

            call_user_func($route['handler'], $params);
            return;
        }

        Response::json(['error' => 'not_found'], 404);
    }

    /** @return array<string, string>|null */
    private function match(string $pattern, string $path): ?array
    {
        $pattern = rtrim($pattern, '/') ?: '/';
        $path = rtrim($path, '/') ?: '/';

        $paramNames = [];
        if (preg_match_all('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', $pattern, $nameMatches)) {
            $paramNames = $nameMatches[1];
        }

        $quotedPattern = preg_quote($pattern, '#');
        $regex = preg_replace('/\\\{[a-zA-Z_][a-zA-Z0-9_]*\\\}/', '([^/]+)', $quotedPattern);

        if (!is_string($regex) || $regex === '') {
            return null;
        }

        $regex = '#^' . $regex . '$#';

        if (!preg_match($regex, $path, $matches)) {
            return null;
        }

        array_shift($matches);
        $params = [];
        foreach ($paramNames as $i => $name) {
            $params[$name] = $matches[$i] ?? '';
        }

        return $params;
    }
}
