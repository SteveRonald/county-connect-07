<?php

declare(strict_types=1);

namespace App;

final class Auth
{
    public static function requireUser(): array
    {
        $auth = Request::authHeader();
        if ($auth === null || !str_starts_with(strtolower($auth), 'bearer ')) {
            Response::json(['error' => 'unauthorized'], 401);
        }

        $token = trim(substr($auth, 7));
        if ($token === '') {
            Response::json(['error' => 'unauthorized'], 401);
        }

        $secret = Env::get('JWT_SECRET', 'change_me');
        $payload = Jwt::decode($token, $secret);
        if ($payload === null) {
            Response::json(['error' => 'unauthorized'], 401);
        }

        $userId = $payload['sub'] ?? null;
        if (!is_int($userId) && !is_string($userId)) {
            Response::json(['error' => 'unauthorized'], 401);
        }

        $pdo = Db::pdo();
        // Keep auth user lookup compatible with both legacy and newer schemas.
        $stmt = $pdo->prepare('SELECT id, name, email, role, department, status, last_login_at FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([(int) $userId]);
        $user = $stmt->fetch();

        if (!is_array($user)) {
            Response::json(['error' => 'unauthorized'], 401);
        }

        if (self::hasTable($pdo, 'user_households')) {
            $hStmt = $pdo->prepare('SELECT household_id FROM user_households WHERE user_id = ? LIMIT 1');
            $hStmt->execute([(int) $user['id']]);
            $hRow = $hStmt->fetch();
            if (is_array($hRow) && !empty($hRow['household_id'])) {
                $user['household_id'] = (int) $hRow['household_id'];
            }
        }

        if (self::hasTable($pdo, 'user_citizens')) {
            $cStmt = $pdo->prepare('SELECT citizen_id FROM user_citizens WHERE user_id = ? ORDER BY citizen_id ASC LIMIT 1');
            $cStmt->execute([(int) $user['id']]);
            $cRow = $cStmt->fetch();
            if (is_array($cRow) && !empty($cRow['citizen_id'])) {
                $user['citizen_id'] = (int) $cRow['citizen_id'];
            }
        }

        return $user;
    }

    private static function hasTable(\PDO $pdo, string $table): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1');
        $stmt->execute([$table]);
        return (bool) $stmt->fetchColumn();
    }
}
