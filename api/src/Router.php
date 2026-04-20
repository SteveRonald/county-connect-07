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

        $regex = preg_replace_callback('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', static function (array $m) use (&$paramNames): string {
            $paramNames[] = $m[1];
            return '([^/]+)';
        }, preg_quote($pattern, '#'));

        if (!is_string($regex)) {
            return null;
        }

        $regex = '#^' . str_replace(['\\{', '\\}'], ['{', '}'], $regex) . '$#';

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
