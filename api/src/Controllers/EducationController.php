<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Response;

final class EducationController
{
    /** @param array<string,string> $params */
    public static function summary(array $params, array $user): void
    {
        $pdo = Db::pdo();

        $facilities = (int) (($pdo->query("SELECT COUNT(*) AS c FROM education_facilities WHERE status = 'Active'")->fetch()['c'] ?? 0));
        $requested = (int) (($pdo->query("SELECT COUNT(*) AS c FROM appointment_requests WHERE service_category = 'Education'")->fetch()['c'] ?? 0));
        $approved = (int) (($pdo->query("SELECT COUNT(*) AS c FROM appointment_requests WHERE service_category = 'Education' AND status = 'Approved'")->fetch()['c'] ?? 0));
        $pending = (int) (($pdo->query("SELECT COUNT(*) AS c FROM appointment_requests WHERE service_category = 'Education' AND status = 'Pending'")->fetch()['c'] ?? 0));

        $typeRows = $pdo->query("SELECT type, COUNT(*) AS total FROM education_facilities WHERE status = 'Active' GROUP BY type ORDER BY total DESC")->fetchAll();
        $typeBreakdown = [];
        foreach ($typeRows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $typeBreakdown[] = [
                'name' => (string) ($row['type'] ?? ''),
                'value' => (int) ($row['total'] ?? 0),
            ];
        }

        Response::json([
            'stats' => [
                ['title' => 'Available Education Facilities', 'value' => $facilities],
                ['title' => 'Requested Appointments', 'value' => $requested],
                ['title' => 'Approved Appointments', 'value' => $approved],
                ['title' => 'Awaiting Approval', 'value' => $pending],
            ],
            'appointmentChart' => [
                ['name' => 'Available Facilities', 'value' => $facilities],
                ['name' => 'Requested', 'value' => $requested],
                ['name' => 'Approved', 'value' => $approved],
                ['name' => 'Pending', 'value' => $pending],
            ],
            'typeBreakdown' => $typeBreakdown,
        ]);
    }
}
