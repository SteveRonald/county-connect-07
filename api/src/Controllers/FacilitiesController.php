<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Request;
use App\Response;

final class FacilitiesController
{
    /** @param array<string,string> $params */
    public static function test(array $params, array $user = []): void
    {
        Response::json(['message' => 'API is working', 'timestamp' => time()]);
    }

    private static function requireAdmin(array $user): void
    {
        if (($user['role'] ?? '') !== 'admin') {
            Response::json(['error' => 'forbidden'], 403);
        }
    }

    /** @param array<string,string> $params */
    public static function healthFacilities(array $params, array $user = []): void
    {
        try {
            $ward = trim((string) (Request::query('ward', '') ?? ''));
            $type = trim((string) (Request::query('type', '') ?? ''));

            $where = ['status = ?'];
            $args = ['Active'];

            if ($ward !== '' && strtolower($ward) !== 'all') {
                $where[] = 'ward = ?';
                $args[] = $ward;
            }

            if ($type !== '') {
                $where[] = 'type = ?';
                $args[] = $type;
            }

            $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

            $pdo = Db::pdo();
            $sql = "SELECT id, name, type, level, ward, sub_county, address, phone, email, services_offered, capacity
                    FROM health_facilities
                    {$whereSql}
                    ORDER BY name";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($args);
            $rows = $stmt->fetchAll();

            Response::json(['data' => $rows]);
        } catch (\Throwable $e) {
            error_log('FacilitiesController error: ' . $e->getMessage());
            Response::json(['error' => 'server_error'], 500);
        }
    }

    /** @param array<string,string> $params */
    public static function createHealthFacility(array $params, array $user = []): void
    {
        self::requireAdmin($user);

        $body = Request::json();
        $name = isset($body['name']) && is_string($body['name']) ? trim($body['name']) : '';
        $type = isset($body['type']) && is_string($body['type']) ? trim($body['type']) : 'Clinic';
        $level = isset($body['level']) && is_string($body['level']) ? trim($body['level']) : 'Level 1';
        $ward = isset($body['ward']) && is_string($body['ward']) ? trim($body['ward']) : '';
        $subCounty = isset($body['sub_county']) && is_string($body['sub_county']) ? trim($body['sub_county']) : null;
        $address = isset($body['address']) && is_string($body['address']) ? trim($body['address']) : null;
        $phone = isset($body['phone']) && is_string($body['phone']) ? trim($body['phone']) : null;
        $email = isset($body['email']) && is_string($body['email']) ? trim($body['email']) : null;
        $capacity = isset($body['capacity']) ? (int) $body['capacity'] : null;

        if ($name === '' || $ward === '') {
            Response::json(['error' => 'validation_error'], 400);
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('INSERT INTO health_facilities (name, type, level, ward, sub_county, address, phone, email, capacity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$name, $type, $level, $ward, $subCounty, $address, $phone, $email, $capacity, 'Active']);

        Response::json(['id' => (int) $pdo->lastInsertId()], 201);
    }

    /** @param array<string,string> $params */
    public static function createEducationFacility(array $params, array $user = []): void
    {
        self::requireAdmin($user);

        $body = Request::json();
        $name = isset($body['name']) && is_string($body['name']) ? trim($body['name']) : '';
        $type = isset($body['type']) && is_string($body['type']) ? trim($body['type']) : 'Primary School';
        $level = isset($body['level']) && is_string($body['level']) ? trim($body['level']) : 'Primary';
        $ward = isset($body['ward']) && is_string($body['ward']) ? trim($body['ward']) : '';
        $subCounty = isset($body['sub_county']) && is_string($body['sub_county']) ? trim($body['sub_county']) : null;
        $address = isset($body['address']) && is_string($body['address']) ? trim($body['address']) : null;
        $phone = isset($body['phone']) && is_string($body['phone']) ? trim($body['phone']) : null;
        $email = isset($body['email']) && is_string($body['email']) ? trim($body['email']) : null;
        $capacity = isset($body['capacity']) ? (int) $body['capacity'] : null;

        if ($name === '' || $ward === '') {
            Response::json(['error' => 'validation_error'], 400);
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('INSERT INTO education_facilities (name, type, level, ward, sub_county, address, phone, email, capacity, current_enrollment, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$name, $type, $level, $ward, $subCounty, $address, $phone, $email, $capacity, 0, 'Active']);

        Response::json(['id' => (int) $pdo->lastInsertId()], 201);
    }

    /** @param array<string,string> $params */
    public static function createSocialProgram(array $params, array $user = []): void
    {
        self::requireAdmin($user);

        $body = Request::json();
        $name = isset($body['name']) && is_string($body['name']) ? trim($body['name']) : '';
        $type = isset($body['type']) && is_string($body['type']) ? trim($body['type']) : 'Other';
        $description = isset($body['description']) && is_string($body['description']) ? trim($body['description']) : null;
        $criteria = isset($body['eligibility_criteria']) && is_string($body['eligibility_criteria']) ? trim($body['eligibility_criteria']) : null;
        $coverageArea = isset($body['coverage_area']) && is_string($body['coverage_area']) ? trim($body['coverage_area']) : null;
        $budget = isset($body['budget_allocated']) ? (float) $body['budget_allocated'] : null;
        $currency = isset($body['currency']) && is_string($body['currency']) ? trim($body['currency']) : 'KES';

        if ($name === '') {
            Response::json(['error' => 'validation_error'], 400);
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('INSERT INTO social_programs (name, type, description, eligibility_criteria, coverage_area, budget_allocated, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$name, $type, $description, $criteria, $coverageArea, $budget, $currency, 'Active']);

        Response::json(['id' => (int) $pdo->lastInsertId()], 201);
    }

    /** @param array<string,string> $params */
    public static function educationFacilities(array $params, array $user = []): void
    {
        $ward = trim((string) (Request::query('ward', '') ?? ''));
        $type = trim((string) (Request::query('type', '') ?? ''));

        $where = ['status = ?'];
        $args = ['Active'];

        if ($ward !== '' && strtolower($ward) !== 'all') {
            $where[] = 'ward = ?';
            $args[] = $ward;
        }

        if ($type !== '') {
            $where[] = 'type = ?';
            $args[] = $type;
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $pdo = Db::pdo();
        $sql = "SELECT id, name, type, level, ward, sub_county, address, phone, email, capacity, current_enrollment
                FROM education_facilities
                {$whereSql}
                ORDER BY name";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($args);
        $rows = $stmt->fetchAll();

        Response::json(['data' => $rows]);
    }

    /** @param array<string,string> $params */
    public static function socialPrograms(array $params, array $user = []): void
    {
        $type = trim((string) (Request::query('type', '') ?? ''));

        $where = ['status = ?'];
        $args = ['Active'];

        if ($type !== '') {
            $where[] = 'type = ?';
            $args[] = $type;
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $pdo = Db::pdo();
        $sql = "SELECT id, name, type, description, eligibility_criteria, coverage_area, budget_allocated, currency
                FROM social_programs
                {$whereSql}
                ORDER BY name";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($args);
        $rows = $stmt->fetchAll();

        Response::json(['data' => $rows]);
    }
}