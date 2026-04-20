<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Request;
use App\Response;

final class AppointmentRequestsController
{
    /** @param array<string,string> $params */
    public static function index(array $params, array $user): void
    {
        $citizenId = (int) (Request::query('citizen_id', '0') ?? '0');
        $status = trim((string) (Request::query('status', '') ?? ''));
        $category = trim((string) (Request::query('category', '') ?? ''));

        $where = [];
        $args = [];

        if ($citizenId > 0) {
            $where[] = 'citizen_id = ?';
            $args[] = $citizenId;
        }

        if ($status !== '') {
            $where[] = 'status = ?';
            $args[] = $status;
        }

        if ($category !== '') {
            $where[] = 'service_category = ?';
            $args[] = $category;
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $pdo = Db::pdo();
        $sql = "SELECT ar.*, c.full_name as citizen_name, c.citizen_code,
                       hf.name as facility_name, sp.name as program_name
                FROM appointment_requests ar
                LEFT JOIN citizens c ON ar.citizen_id = c.id
                LEFT JOIN health_facilities hf ON ar.facility_id = hf.id
                LEFT JOIN social_programs sp ON ar.program_id = sp.id
                {$whereSql}
                ORDER BY ar.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($args);
        $rows = $stmt->fetchAll();

        Response::json(['data' => $rows]);
    }

    /** @param array<string,string> $params */
    public static function create(array $params, array $user): void
    {
        $body = Request::json();

        $citizenId = isset($body['citizen_id']) ? (int) $body['citizen_id'] : null;
        $serviceCategory = isset($body['service_category']) && is_string($body['service_category']) ? trim($body['service_category']) : '';
        $facilityId = isset($body['facility_id']) ? (int) $body['facility_id'] : null;
        $programId = isset($body['program_id']) ? (int) $body['program_id'] : null;
        $serviceType = isset($body['service_type']) && is_string($body['service_type']) ? trim($body['service_type']) : '';
        $preferredDate = isset($body['preferred_date']) && is_string($body['preferred_date']) ? trim($body['preferred_date']) : '';
        $preferredTime = isset($body['preferred_time']) && is_string($body['preferred_time']) ? trim($body['preferred_time']) : null;
        $urgency = isset($body['urgency']) && is_string($body['urgency']) ? trim($body['urgency']) : 'Medium';
        $description = isset($body['description']) && is_string($body['description']) ? trim($body['description']) : '';

        if (!$citizenId || $serviceCategory === '' || $serviceType === '' || $preferredDate === '') {
            Response::json(['error' => 'validation_error'], 400);
        }

        // If user is tied to a household, ensure selected resident belongs to that household.
        if (!empty($user['household_id'])) {
            $check = Db::pdo();
            if (self::hasColumn($check, 'citizens', 'household_id')) {
                $stmt = $check->prepare('SELECT id FROM citizens WHERE id = ? AND household_id = ? LIMIT 1');
                $stmt->execute([$citizenId, (int) $user['household_id']]);
            } elseif (self::hasTable($check, 'citizen_households')) {
                $stmt = $check->prepare('SELECT citizen_id AS id FROM citizen_households WHERE citizen_id = ? AND household_id = ? LIMIT 1');
                $stmt->execute([$citizenId, (int) $user['household_id']]);
            } else {
                $stmt = $check->prepare('SELECT id FROM citizens WHERE id = ? LIMIT 1');
                $stmt->execute([$citizenId]);
            }
            if (!$stmt->fetch()) {
                Response::json(['error' => 'invalid_resident_for_household'], 403);
            }
        }

        // Validate facility/program based on category
        if ($serviceCategory === 'Health' && !$facilityId) {
            Response::json(['error' => 'facility_required'], 400);
        }
        if ($serviceCategory === 'Social Support' && !$programId) {
            Response::json(['error' => 'program_required'], 400);
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('INSERT INTO appointment_requests
            (citizen_id, service_category, facility_id, program_id, service_type, preferred_date, preferred_time, urgency, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$citizenId, $serviceCategory, $facilityId, $programId, $serviceType, $preferredDate, $preferredTime, $urgency, $description]);

        $appointmentId = (int) $pdo->lastInsertId();
        if (self::hasTable($pdo, 'service_tracking')) {
            $trackingStmt = $pdo->prepare('INSERT INTO service_tracking (citizen_id, service_category, service_id, action, performed_by, notes) VALUES (?, ?, ?, ?, ?, ?)');
            $trackingStmt->execute([
                $citizenId,
                $serviceCategory,
                $appointmentId,
                'Created',
                $user['id'] ?? null,
                $description !== '' ? $description : 'Appointment request created',
            ]);
        }

        Response::json(['id' => $appointmentId], 201);
    }

    /** @param array<string,string> $params */
    public static function updateStatus(array $params, array $user): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::json(['error' => 'not_found'], 404);
        }

        $body = Request::json();
        $status = isset($body['status']) && is_string($body['status']) ? trim($body['status']) : '';
        $rejectionReason = isset($body['rejection_reason']) && is_string($body['rejection_reason']) ? trim($body['rejection_reason']) : null;

        if ($status === '') {
            Response::json(['error' => 'validation_error'], 400);
        }

        $pdo = Db::pdo();

        // Check if request exists
        $stmt = $pdo->prepare('SELECT id FROM appointment_requests WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::json(['error' => 'not_found'], 404);
        }

        $approvedAt = null;
        if (in_array($status, ['Approved', 'Rejected', 'Completed'])) {
            $approvedAt = date('Y-m-d H:i:s');
        }

        $stmt = $pdo->prepare('UPDATE appointment_requests SET
            status = ?, approved_by = ?, approved_at = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?');
        $stmt->execute([$status, $user['id'], $approvedAt, $rejectionReason, $id]);

        Response::json(['success' => true]);
    }

    private static function hasTable(\PDO $pdo, string $table): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1');
        $stmt->execute([$table]);
        return (bool) $stmt->fetchColumn();
    }

    private static function hasColumn(\PDO $pdo, string $table, string $column): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1');
        $stmt->execute([$table, $column]);
        return (bool) $stmt->fetchColumn();
    }
}