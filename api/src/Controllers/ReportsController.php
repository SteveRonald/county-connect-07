<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Request;
use App\Response;

final class ReportsController
{
    /** @param array<string,string> $params */
    public static function templates(array $params, array $user): void
    {
        Response::json([
            'data' => [
                ['id' => 'population', 'name' => 'Population Summary', 'description' => 'Complete demographic overview', 'department' => 'Demographics'],
                ['id' => 'health', 'name' => 'Health Statistics', 'description' => 'Immunization and disease reports', 'department' => 'Health'],
                ['id' => 'education', 'name' => 'Education Report', 'description' => 'Enrollment and literacy data', 'department' => 'Education'],
                ['id' => 'social', 'name' => 'Social Welfare Report', 'description' => 'Beneficiary and program data', 'department' => 'Social Services'],
                ['id' => 'combined', 'name' => 'Combined Annual Report', 'description' => 'All departments summary', 'department' => 'All'],
            ],
        ]);
    }

    /** @param array<string,string> $params */
    public static function recent(array $params, array $user): void
    {
        $pdo = Db::pdo();
        $rows = $pdo->query('SELECT id, name, generated_at, file_type, file_size FROM reports ORDER BY generated_at DESC LIMIT 20')->fetchAll();

        Response::json(['data' => $rows]);
    }

    /** @param array<string,string> $params */
    public static function generate(array $params, array $user): void
    {
        $body = Request::json();

        $department = isset($body['department']) && is_string($body['department']) ? trim($body['department']) : 'all';
        $period = isset($body['period']) && is_string($body['period']) ? trim($body['period']) : 'monthly';
        $fileType = isset($body['file_type']) && is_string($body['file_type']) ? strtoupper(trim($body['file_type'])) : 'PDF';

        if (!in_array($fileType, ['PDF', 'EXCEL'], true)) {
            $fileType = 'PDF';
        }

        $name = strtoupper($department) . ' ' . strtoupper($period) . ' REPORT';

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('INSERT INTO reports (name, department, period, file_type, file_size) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$name, $department, $period, $fileType, '0 KB']);

        Response::json(['id' => (int) $pdo->lastInsertId(), 'name' => $name], 201);
    }
}
