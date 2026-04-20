<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Request;
use App\Response;

final class AdminAppointmentsController
{
    /** @param array<string,string> $params */
    public static function pendingAppointments(array $params, array $user): void
    {
        // Only admin/staff can view pending appointments
        if (!in_array($user['role'] ?? '', ['admin', 'staff', 'manager'])) {
            Response::json(['error' => 'unauthorized'], 403);
        }

        $pdo = Db::pdo();
        $sql = "SELECT ar.*, c.full_name, c.citizen_code, c.age, c.ward,
                       hf.name as health_facility_name, hf.type as facility_type,
                       ef.name as education_facility_name, ef.type as education_type,
                       sp.name as program_name
                FROM appointment_requests ar
                LEFT JOIN citizens c ON ar.citizen_id = c.id
                LEFT JOIN health_facilities hf ON ar.facility_id = hf.id AND ar.service_category = 'Health'
                LEFT JOIN education_facilities ef ON ar.facility_id = ef.id AND ar.service_category = 'Education'
                LEFT JOIN social_programs sp ON ar.program_id = sp.id AND ar.service_category = 'Social Support'
                WHERE ar.status = 'Pending'
                ORDER BY ar.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        Response::json(['data' => $rows]);
    }

    /** @param array<string,string> $params */
    public static function approveAppointment(array $params, array $user): void
    {
        // Only admin/staff can approve appointments
        if (!in_array($user['role'] ?? '', ['admin', 'staff', 'manager'])) {
            Response::json(['error' => 'unauthorized'], 403);
        }

        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::json(['error' => 'not_found'], 404);
        }

        $pdo = Db::pdo();

        // Fetch appointment request and citizen info
        $stmt = $pdo->prepare('SELECT ar.*, c.full_name, c.email FROM appointment_requests ar
                               LEFT JOIN citizens c ON ar.citizen_id = c.id
                               WHERE ar.id = ?');
        $stmt->execute([$id]);
        $appointment = $stmt->fetch();

        if (!is_array($appointment)) {
            Response::json(['error' => 'not_found'], 404);
        }

        // Update status to Approved
        $stmt = $pdo->prepare('UPDATE appointment_requests SET
            status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?');
        $stmt->execute(['Approved', $user['id'], $id]);

        // Create notification for the resident
        $title = "Appointment Approved";
        $message = "Your appointment request for {$appointment['service_type']} has been approved. Please check your dashboard for details.";
        
        $notifyStmt = $pdo->prepare('INSERT INTO notifications (user_id, title, message, type, priority, created_at)
                                      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
        $notifyStmt->execute([$appointment['citizen_id'], $title, $message, 'Service', 'High']);

        Response::json(['success' => true, 'message' => 'Appointment approved']);
    }

    /** @param array<string,string> $params */
    public static function rejectAppointment(array $params, array $user): void
    {
        // Only admin/staff can reject appointments
        if (!in_array($user['role'] ?? '', ['admin', 'staff', 'manager'])) {
            Response::json(['error' => 'unauthorized'], 403);
        }

        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::json(['error' => 'not_found'], 404);
        }

        $body = Request::json();
        $rejectionReason = isset($body['rejection_reason']) && is_string($body['rejection_reason']) ? trim($body['rejection_reason']) : '';

        if ($rejectionReason === '') {
            Response::json(['error' => 'rejection_reason_required'], 400);
        }

        $pdo = Db::pdo();

        // Fetch appointment request
        $stmt = $pdo->prepare('SELECT ar.* FROM appointment_requests ar WHERE ar.id = ?');
        $stmt->execute([$id]);
        $appointment = $stmt->fetch();

        if (!is_array($appointment)) {
            Response::json(['error' => 'not_found'], 404);
        }

        // Update status to Rejected
        $stmt = $pdo->prepare('UPDATE appointment_requests SET
            status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?');
        $stmt->execute(['Rejected', $user['id'], $rejectionReason, $id]);

        // Create notification for the resident
        $title = "Appointment Rejected";
        $message = "Your appointment request has been rejected. Reason: {$rejectionReason}";
        
        $notifyStmt = $pdo->prepare('INSERT INTO notifications (user_id, title, message, type, priority, created_at)
                                      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
        $notifyStmt->execute([$appointment['citizen_id'], $title, $message, 'Service', 'High']);

        Response::json(['success' => true, 'message' => 'Appointment rejected']);
    }

    /** @param array<string,string> $params */
    public static function allAppointments(array $params, array $user): void
    {
        // Only admin/staff can view appointments
        if (!in_array($user['role'] ?? '', ['admin', 'staff', 'manager'])) {
            Response::json(['error' => 'unauthorized'], 403);
        }

        $status = trim((string) (Request::query('status', '') ?? ''));
        $category = trim((string) (Request::query('category', '') ?? ''));

        $where = [];
        $args = [];

        if ($status !== '') {
            $where[] = 'ar.status = ?';
            $args[] = $status;
        }

        if ($category !== '') {
            $where[] = 'ar.service_category = ?';
            $args[] = $category;
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $pdo = Db::pdo();
        $sql = "SELECT ar.*, c.full_name, c.citizen_code, c.age, c.ward,
                       hf.name as health_facility_name, hf.type as facility_type,
                       ef.name as education_facility_name, ef.type as education_type,
                       sp.name as program_name, u.name as approved_by_name
                FROM appointment_requests ar
                LEFT JOIN citizens c ON ar.citizen_id = c.id
                LEFT JOIN health_facilities hf ON ar.facility_id = hf.id AND ar.service_category = 'Health'
                LEFT JOIN education_facilities ef ON ar.facility_id = ef.id AND ar.service_category = 'Education'
                LEFT JOIN social_programs sp ON ar.program_id = sp.id AND ar.service_category = 'Social Support'
                LEFT JOIN users u ON ar.approved_by = u.id
                {$whereSql}
                ORDER BY ar.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($args);
        $rows = $stmt->fetchAll();

        Response::json(['data' => $rows]);
    }
}