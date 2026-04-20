<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Request;
use App\Response;

final class CitizensController
{
    /** @param array<string,string> $params */
    public static function index(array $params, array $user): void
    {
        $search = trim((string) (Request::query('search', '') ?? ''));
        $ward = trim((string) (Request::query('ward', '') ?? ''));
        $scope = trim((string) (Request::query('scope', '') ?? ''));
        $householdId = (int) (Request::query('household_id', '0') ?? '0');
        $page = (int) (Request::query('page', '1') ?? '1');
        $limit = (int) (Request::query('limit', '50') ?? '50');

        if ($page < 1) {
            $page = 1;
        }
        if ($limit < 1 || $limit > 200) {
            $limit = 50;
        }

        $where = [];
        $args = [];

        if ($search !== '') {
            $where[] = '(full_name LIKE ? OR id_number LIKE ? OR citizen_code LIKE ?)';
            $like = '%' . $search . '%';
            $args[] = $like;
            $args[] = $like;
            $args[] = $like;
        }

        if ($ward !== '' && strtolower($ward) !== 'all') {
            $where[] = 'ward = ?';
            $args[] = $ward;
        }

        $pdo = Db::pdo();
        self::ensureOwnershipTable($pdo);
        $hasHouseholdId = self::hasColumn($pdo, 'citizens', 'household_id');
        $hasCitizenHouseholds = self::hasTable($pdo, 'citizen_households');

        $forceMine = strtolower($scope) === 'mine';
        $isAdmin = self::isAdmin($user);
        if (($forceMine || !$isAdmin) && !empty($user['id'])) {
            $where[] = 'id IN (SELECT citizen_id FROM user_citizens WHERE user_id = ?)';
            $args[] = (int) $user['id'];
        }

        if ($householdId > 0) {
            if ($hasHouseholdId) {
                $where[] = 'household_id = ?';
                $args[] = $householdId;
            } elseif ($hasCitizenHouseholds) {
                $where[] = 'id IN (SELECT citizen_id FROM citizen_households WHERE household_id = ?)';
                $args[] = $householdId;
            }
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
        $offset = ($page - 1) * $limit;

        $countStmt = $pdo->prepare("SELECT COUNT(*) AS c FROM citizens {$whereSql}");
        $countStmt->execute($args);
        $countRow = $countStmt->fetch();
        $total = is_array($countRow) ? (int) ($countRow['c'] ?? 0) : 0;

        $householdSelect = $hasHouseholdId
            ? 'household_id'
            : ($hasCitizenHouseholds
                ? '(SELECT ch.household_id FROM citizen_households ch WHERE ch.citizen_id = citizens.id LIMIT 1) AS household_id'
                : 'NULL AS household_id');
        $sql = "SELECT id, citizen_code, full_name, id_number, gender, age, ward, {$householdSelect}, status, created_at
                FROM citizens
                {$whereSql}
                ORDER BY id DESC
                LIMIT {$limit} OFFSET {$offset}";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($args);
        $rows = $stmt->fetchAll();

        Response::json([
            'data' => $rows,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
        ]);
    }

    /** @param array<string,string> $params */
    public static function show(array $params, array $user): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::json(['error' => 'not_found'], 404);
        }

        $pdo = Db::pdo();
        self::ensureOwnershipTable($pdo);
        if (!self::isAdmin($user) && !self::isCitizenOwnedByUser($pdo, (int) ($user['id'] ?? 0), $id)) {
            Response::json(['error' => 'forbidden'], 403);
        }

        $hasHouseholdId = self::hasColumn($pdo, 'citizens', 'household_id');
        $hasCitizenHouseholds = self::hasTable($pdo, 'citizen_households');
        $householdSelect = $hasHouseholdId
            ? 'household_id'
            : ($hasCitizenHouseholds
                ? '(SELECT ch.household_id FROM citizen_households ch WHERE ch.citizen_id = citizens.id LIMIT 1) AS household_id'
                : 'NULL AS household_id');
        $stmt = $pdo->prepare('SELECT id, citizen_code, full_name, id_number, gender, age, ward, ' . $householdSelect . ', status, created_at FROM citizens WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!is_array($row)) {
            Response::json(['error' => 'not_found'], 404);
        }

        Response::json(['data' => $row]);
    }

    /** @param array<string,string> $params */
    public static function create(array $params, array $user): void
    {
        $body = Request::json();

        $fullName = isset($body['full_name']) && is_string($body['full_name']) ? trim($body['full_name']) : '';
        $idNumber = isset($body['id_number']) && is_string($body['id_number']) ? trim($body['id_number']) : '';
        $gender = isset($body['gender']) && is_string($body['gender']) ? trim($body['gender']) : '';
        $age = isset($body['age']) ? (int) $body['age'] : null;
        $ward = isset($body['ward']) && is_string($body['ward']) ? trim($body['ward']) : '';
        $subCounty = isset($body['constituency']) && is_string($body['constituency']) ? trim($body['constituency']) : '';
        $status = isset($body['status']) && is_string($body['status']) ? trim($body['status']) : 'Active';

        if ($fullName === '' || $idNumber === '' || $ward === '' || $age === null) {
            Response::json(['error' => 'validation_error'], 400);
        }

        $citizenCode = isset($body['citizen_code']) && is_string($body['citizen_code']) ? trim($body['citizen_code']) : '';
        if ($citizenCode === '') {
            $citizenCode = 'CIT-' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        }

        $pdo = Db::pdo();
        self::ensureOwnershipTable($pdo);
        $hasHouseholdId = self::hasColumn($pdo, 'citizens', 'household_id');
        $hasDateOfBirth = self::hasColumn($pdo, 'citizens', 'date_of_birth');
        $hasSubCounty = self::hasColumn($pdo, 'citizens', 'sub_county');

        $userId = !empty($user['id']) ? (int) $user['id'] : 0;
        $householdId = !empty($user['household_id']) ? (int) $user['household_id'] : 0;
        if ($userId > 0 && $householdId < 1) {
            $householdId = self::getOrCreateUserHouseholdId($pdo, $userId, $ward, $subCounty);
        }

        if ($hasHouseholdId && $householdId < 1) {
            $householdId = self::getOrCreateUserHouseholdId($pdo, $userId, $ward, $subCounty);
        }

        if ($hasDateOfBirth) {
            // Generate a date of birth from provided age to satisfy schemas that require date_of_birth.
            $dob = null;
            if ($age !== null && $age > 0) {
                $dob = date('Y-m-d', strtotime('-' . $age . ' years'));
            }

            if ($hasHouseholdId && $hasSubCounty) {
                $stmt = $pdo->prepare('INSERT INTO citizens (citizen_code, full_name, id_number, gender, date_of_birth, ward, sub_county, household_id, status)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$citizenCode, $fullName, $idNumber, $gender, $dob ?? date('Y-m-d', strtotime('-18 years')), $ward, $subCounty !== '' ? $subCounty : null, $householdId, $status]);
            } elseif ($hasHouseholdId) {
                $stmt = $pdo->prepare('INSERT INTO citizens (citizen_code, full_name, id_number, gender, date_of_birth, ward, household_id, status)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$citizenCode, $fullName, $idNumber, $gender, $dob ?? date('Y-m-d', strtotime('-18 years')), $ward, $householdId, $status]);
            } elseif ($hasSubCounty) {
                $stmt = $pdo->prepare('INSERT INTO citizens (citizen_code, full_name, id_number, gender, date_of_birth, ward, sub_county, status)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$citizenCode, $fullName, $idNumber, $gender, $dob ?? date('Y-m-d', strtotime('-18 years')), $ward, $subCounty !== '' ? $subCounty : null, $status]);
            } else {
                $stmt = $pdo->prepare('INSERT INTO citizens (citizen_code, full_name, id_number, gender, date_of_birth, ward, status)
                                       VALUES (?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$citizenCode, $fullName, $idNumber, $gender, $dob ?? date('Y-m-d', strtotime('-18 years')), $ward, $status]);
            }
        } else {
            // Legacy schema stores age directly and may not have household_id/sub_county.
            if ($hasHouseholdId && $hasSubCounty) {
                $stmt = $pdo->prepare('INSERT INTO citizens (citizen_code, full_name, id_number, gender, age, ward, sub_county, household_id, status)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$citizenCode, $fullName, $idNumber, $gender, $age, $ward, $subCounty !== '' ? $subCounty : null, $householdId, $status]);
            } elseif ($hasHouseholdId) {
                $stmt = $pdo->prepare('INSERT INTO citizens (citizen_code, full_name, id_number, gender, age, ward, household_id, status)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$citizenCode, $fullName, $idNumber, $gender, $age, $ward, $householdId, $status]);
            } elseif ($hasSubCounty) {
                $stmt = $pdo->prepare('INSERT INTO citizens (citizen_code, full_name, id_number, gender, age, ward, sub_county, status)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$citizenCode, $fullName, $idNumber, $gender, $age, $ward, $subCounty !== '' ? $subCounty : null, $status]);
            } else {
                $stmt = $pdo->prepare('INSERT INTO citizens (citizen_code, full_name, id_number, gender, age, ward, status)
                                       VALUES (?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$citizenCode, $fullName, $idNumber, $gender, $age, $ward, $status]);
            }
        }

        $citizenId = (int) $pdo->lastInsertId();
        if ($userId > 0) {
            self::attachCitizenToUser($pdo, $userId, $citizenId);
        }
        if ($householdId > 0 && !$hasHouseholdId) {
            self::attachCitizenToHousehold($pdo, $citizenId, $householdId);
        }

        Response::json([
            'id' => $citizenId,
            'household_id' => $householdId > 0 ? $householdId : null,
            'citizen_code' => $citizenCode,
        ], 201);
    }

    /** @param array<string,string> $params */
    public static function update(array $params, array $user): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::json(['error' => 'not_found'], 404);
        }

        $pdo = Db::pdo();
        self::ensureOwnershipTable($pdo);
        if (!self::isAdmin($user) && !self::isCitizenOwnedByUser($pdo, (int) ($user['id'] ?? 0), $id)) {
            Response::json(['error' => 'forbidden'], 403);
        }

        $body = Request::json();
        $fields = [];
        $args = [];

        $map = [
            'citizen_code' => 'citizen_code',
            'full_name' => 'full_name',
            'id_number' => 'id_number',
            'gender' => 'gender',
            'age' => 'age',
            'ward' => 'ward',
            'status' => 'status',
        ];

        foreach ($map as $k => $col) {
            if (!array_key_exists($k, $body)) {
                continue;
            }

            $val = $body[$k];
            if ($k === 'age') {
                $val = (int) $val;
            } elseif (!is_string($val)) {
                continue;
            } else {
                $val = trim($val);
            }

            $fields[] = $col . ' = ?';
            $args[] = $val;
        }

        if (array_key_exists('household_id', $body)) {
            $householdId = $body['household_id'] === null ? null : (int) $body['household_id'];
            if (self::hasColumn($pdo, 'citizens', 'household_id')) {
                if (!self::isAdmin($user)) {
                    $userHouseholdId = !empty($user['household_id']) ? (int) $user['household_id'] : 0;
                    if ($userHouseholdId < 1 || $householdId !== $userHouseholdId) {
                        Response::json(['error' => 'forbidden_household_change'], 403);
                    }
                }
                $fields[] = 'household_id = ?';
                $args[] = $householdId;
            } elseif (self::hasTable($pdo, 'citizen_households')) {
                if (!self::isAdmin($user)) {
                    $userHouseholdId = !empty($user['household_id']) ? (int) $user['household_id'] : 0;
                    if ($userHouseholdId < 1 || $householdId !== $userHouseholdId) {
                        Response::json(['error' => 'forbidden_household_change'], 403);
                    }
                }

                if ($householdId !== null && $householdId > 0) {
                    self::attachCitizenToHousehold($pdo, $id, $householdId);
                }
            }
        }

        if (!$fields) {
            Response::json(['ok' => true]);
        }

        $args[] = $id;
        $stmt = $pdo->prepare('UPDATE citizens SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($args);

        Response::json(['ok' => true]);
    }

    /** @param array<string,string> $params */
    public static function delete(array $params, array $user): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::json(['error' => 'not_found'], 404);
        }

        $pdo = Db::pdo();
        self::ensureOwnershipTable($pdo);
        if (!self::isAdmin($user) && !self::isCitizenOwnedByUser($pdo, (int) ($user['id'] ?? 0), $id)) {
            Response::json(['error' => 'forbidden'], 403);
        }

        $detach = $pdo->prepare('DELETE FROM user_citizens WHERE citizen_id = ?');
        $detach->execute([$id]);

        if (self::hasTable($pdo, 'citizen_households')) {
            $detachHousehold = $pdo->prepare('DELETE FROM citizen_households WHERE citizen_id = ?');
            $detachHousehold->execute([$id]);
        }

        $stmt = $pdo->prepare('DELETE FROM citizens WHERE id = ?');
        $stmt->execute([$id]);

        Response::json(['ok' => true]);
    }

    private static function hasColumn(\PDO $pdo, string $table, string $column): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1');
        $stmt->execute([$table, $column]);
        return (bool) $stmt->fetchColumn();
    }

    private static function hasTable(\PDO $pdo, string $table): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1');
        $stmt->execute([$table]);
        return (bool) $stmt->fetchColumn();
    }

    private static function isAdmin(array $user): bool
    {
        return (($user['role'] ?? '') === 'admin');
    }

    private static function ensureOwnershipTable(\PDO $pdo): void
    {
        $pdo->exec('CREATE TABLE IF NOT EXISTS user_citizens (
            user_id INT(10) UNSIGNED NOT NULL,
            citizen_id INT(10) UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, citizen_id),
            KEY idx_user_citizens_citizen (citizen_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

        $pdo->exec('CREATE TABLE IF NOT EXISTS user_households (
            user_id INT(10) UNSIGNED NOT NULL,
            household_id INT(10) UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id),
            KEY idx_user_households_household (household_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

        $pdo->exec('CREATE TABLE IF NOT EXISTS citizen_households (
            citizen_id INT(10) UNSIGNED NOT NULL,
            household_id INT(10) UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (citizen_id),
            KEY idx_citizen_households_household (household_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    private static function attachCitizenToUser(\PDO $pdo, int $userId, int $citizenId): void
    {
        if ($userId < 1 || $citizenId < 1) {
            return;
        }
        $stmt = $pdo->prepare('INSERT IGNORE INTO user_citizens (user_id, citizen_id) VALUES (?, ?)');
        $stmt->execute([$userId, $citizenId]);
    }

    private static function isCitizenOwnedByUser(\PDO $pdo, int $userId, int $citizenId): bool
    {
        if ($userId < 1 || $citizenId < 1) {
            return false;
        }
        $stmt = $pdo->prepare('SELECT 1 FROM user_citizens WHERE user_id = ? AND citizen_id = ? LIMIT 1');
        $stmt->execute([$userId, $citizenId]);
        return (bool) $stmt->fetchColumn();
    }

    private static function getOrCreateUserHouseholdId(\PDO $pdo, int $userId, string $ward, string $subCounty): int
    {
        if ($userId < 1 || !self::hasTable($pdo, 'households')) {
            return 0;
        }

        if (self::hasTable($pdo, 'user_households')) {
            $existing = $pdo->prepare('SELECT household_id FROM user_households WHERE user_id = ? LIMIT 1');
            $existing->execute([$userId]);
            $row = $existing->fetch();
            if (is_array($row) && !empty($row['household_id'])) {
                return (int) $row['household_id'];
            }
        }

        $householdCode = 'HH-' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        $hStmt = $pdo->prepare('INSERT INTO households (household_code, ward, sub_county, status) VALUES (?, ?, ?, ?)');
        $hStmt->execute([$householdCode, $ward !== '' ? $ward : null, $subCounty !== '' ? $subCounty : null, 'Active']);
        $householdId = (int) $pdo->lastInsertId();

        if ($householdId > 0 && self::hasTable($pdo, 'user_households')) {
            $link = $pdo->prepare('INSERT INTO user_households (user_id, household_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE household_id = VALUES(household_id)');
            $link->execute([$userId, $householdId]);
        }

        return $householdId;
    }

    private static function attachCitizenToHousehold(\PDO $pdo, int $citizenId, int $householdId): void
    {
        if ($citizenId < 1 || $householdId < 1 || !self::hasTable($pdo, 'citizen_households')) {
            return;
        }
        $stmt = $pdo->prepare('INSERT INTO citizen_households (citizen_id, household_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE household_id = VALUES(household_id)');
        $stmt->execute([$citizenId, $householdId]);
    }
}
