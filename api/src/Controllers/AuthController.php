<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Env;
use App\Jwt;
use App\Request;
use App\Response;

final class AuthController
{
    /** @param array<string,string> $params */
    public static function login(array $params): void
    {
        $body = Request::json();

        $email = isset($body['email']) && is_string($body['email']) ? trim($body['email']) : '';
        $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';

        if ($email === '' || $password === '') {
            Response::json(['error' => 'invalid_credentials'], 400);
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('SELECT id, name, email, password_hash, role, department, status FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!is_array($user) || !isset($user['password_hash']) || !is_string($user['password_hash'])) {
            Response::json(['error' => 'invalid_credentials'], 401);
        }

        if (($user['status'] ?? '') !== 'Active') {
            Response::json(['error' => 'account_inactive'], 403);
        }

        if (!password_verify($password, $user['password_hash'])) {
            Response::json(['error' => 'invalid_credentials'], 401);
        }

        $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([(int) $user['id']]);

        $secret = Env::get('JWT_SECRET', 'change_me');
        $ttl = (int) (Env::get('JWT_TTL_SECONDS', '28800') ?? '28800');

        $token = Jwt::encode([
            'sub' => (int) $user['id'],
            'email' => (string) $user['email'],
            'role' => (string) ($user['role'] ?? ''),
        ], $secret, $ttl);

        Response::json([
            'token' => $token,
            'user' => [
                'id' => (int) $user['id'],
                'name' => (string) ($user['name'] ?? ''),
                'email' => (string) ($user['email'] ?? ''),
                'role' => (string) ($user['role'] ?? ''),
                'department' => (string) ($user['department'] ?? ''),
                'status' => (string) ($user['status'] ?? ''),
            ],
        ]);
    }

    /** @param array<string,string> $params */
    public static function register(array $params): void
    {
        $body = Request::json();

        $name = isset($body['name']) && is_string($body['name']) ? trim($body['name']) : '';
        $email = isset($body['email']) && is_string($body['email']) ? trim($body['email']) : '';
        $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';

        if ($name === '' || $email === '' || $password === '') {
            Response::json(['error' => 'validation_error'], 400);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        if (!is_string($hash)) {
            Response::json(['error' => 'server_error'], 500);
        }

        $pdo = Db::pdo();

        try {
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, department, status) VALUES (?, ?, ?, 'admin', 'All', 'Active')");
            $stmt->execute([$name, $email, $hash]);
        } catch (\Throwable $e) {
            Response::json(['error' => 'email_exists'], 409);
        }

        $userId = (int) $pdo->lastInsertId();

        $secret = Env::get('JWT_SECRET', 'change_me');
        $ttl = (int) (Env::get('JWT_TTL_SECONDS', '28800') ?? '28800');

        $token = Jwt::encode([
            'sub' => $userId,
            'email' => $email,
            'role' => 'admin',
        ], $secret, $ttl);

        Response::json([
            'token' => $token,
            'user' => [
                'id' => $userId,
                'name' => $name,
                'email' => $email,
                'role' => 'admin',
                'department' => 'All',
                'status' => 'Active',
            ],
        ], 201);
    }

    /** @param array<string,string> $params */
    public static function me(array $params, array $user): void
    {
        // attempt to attach related citizen record (if exists) by email
        $pdo = \App\Db::pdo();
        $citizen = null;
        if (!empty($user['email']) && self::hasColumn($pdo, 'citizens', 'email')) {
            if (self::hasColumn($pdo, 'citizens', 'household_id')) {
                $stmt = $pdo->prepare('SELECT c.id AS citizen_id, c.citizen_code, c.household_id, h.household_code FROM citizens c LEFT JOIN households h ON h.id = c.household_id WHERE c.email = ? LIMIT 1');
                $stmt->execute([(string) $user['email']]);
            } else {
                $stmt = $pdo->prepare('SELECT c.id AS citizen_id, c.citizen_code FROM citizens c WHERE c.email = ? LIMIT 1');
                $stmt->execute([(string) $user['email']]);
            }
            $citizen = $stmt->fetch();
        }

        if (is_array($citizen)) {
            $user['citizen_id'] = (int) ($citizen['citizen_id'] ?? 0);
            $user['citizen_code'] = (string) ($citizen['citizen_code'] ?? '');
            if (array_key_exists('household_id', $citizen)) {
                $user['household_id'] = (int) ($citizen['household_id'] ?? 0);
            }
            if (array_key_exists('household_code', $citizen)) {
                $user['household_code'] = (string) ($citizen['household_code'] ?? '');
            }
        }

        Response::json(['user' => $user]);
    }

    private static function hasColumn(\PDO $pdo, string $table, string $column): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1');
        $stmt->execute([$table, $column]);
        return (bool) $stmt->fetchColumn();
    }
}
