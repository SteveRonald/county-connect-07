<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Request;
use App\Response;

final class UsersController
{
    /** @param array<string,string> $params */
    public static function index(array $params, array $authUser): void
    {
        $search = trim((string) (Request::query('search', '') ?? ''));

        $whereSql = '';
        $args = [];

        if ($search !== '') {
            $whereSql = 'WHERE name LIKE ? OR email LIKE ?';
            $like = '%' . $search . '%';
            $args = [$like, $like];
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare("SELECT id, name, email, role, department, status, last_login_at, created_at FROM users {$whereSql} ORDER BY id DESC");
        $stmt->execute($args);
        $rows = $stmt->fetchAll();

        Response::json(['data' => $rows]);
    }

    /** @param array<string,string> $params */
    public static function show(array $params, array $authUser): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::json(['error' => 'not_found'], 404);
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('SELECT id, name, email, role, department, status, last_login_at, created_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!is_array($row)) {
            Response::json(['error' => 'not_found'], 404);
        }

        Response::json(['data' => $row]);
    }

    /** @param array<string,string> $params */
    public static function create(array $params, array $authUser): void
    {
        $body = Request::json();

        $name = isset($body['name']) && is_string($body['name']) ? trim($body['name']) : '';
        $email = isset($body['email']) && is_string($body['email']) ? trim($body['email']) : '';
        $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
        $role = isset($body['role']) && is_string($body['role']) ? trim($body['role']) : 'admin';
        $department = isset($body['department']) && is_string($body['department']) ? trim($body['department']) : 'All';
        $status = isset($body['status']) && is_string($body['status']) ? trim($body['status']) : 'Active';

        if ($name === '' || $email === '' || $password === '') {
            Response::json(['error' => 'validation_error'], 400);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        if (!is_string($hash)) {
            Response::json(['error' => 'server_error'], 500);
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash, role, department, status) VALUES (?, ?, ?, ?, ?, ?)');

        try {
            $stmt->execute([$name, $email, $hash, $role, $department, $status]);
        } catch (\Throwable $e) {
            Response::json(['error' => 'email_exists'], 409);
        }

        Response::json(['id' => (int) $pdo->lastInsertId()], 201);
    }

    /** @param array<string,string> $params */
    public static function update(array $params, array $authUser): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::json(['error' => 'not_found'], 404);
        }

        $body = Request::json();
        $fields = [];
        $args = [];

        $stringFields = ['name', 'email', 'role', 'department', 'status'];
        foreach ($stringFields as $f) {
            if (!array_key_exists($f, $body) || !is_string($body[$f])) {
                continue;
            }
            $fields[] = $f . ' = ?';
            $args[] = trim($body[$f]);
        }

        if (array_key_exists('password', $body) && is_string($body['password']) && $body['password'] !== '') {
            $hash = password_hash($body['password'], PASSWORD_BCRYPT);
            if (is_string($hash)) {
                $fields[] = 'password_hash = ?';
                $args[] = $hash;
            }
        }

        if (!$fields) {
            Response::json(['ok' => true]);
        }

        $args[] = $id;

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($args);

        Response::json(['ok' => true]);
    }

    /** @param array<string,string> $params */
    public static function delete(array $params, array $authUser): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::json(['error' => 'not_found'], 404);
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);

        Response::json(['ok' => true]);
    }
}
