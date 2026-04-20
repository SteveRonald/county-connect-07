<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Response;
use App\Request;
use DateTime;
use DateInterval;

final class DashboardController
{
    private const SERVICE_CATEGORY_MAP = [
        'Health' => 'Health',
        'Education' => 'Education',
        'Social Support' => 'Social Support',
    ];

    /** @param array<string,string> $params */
    public static function summary(array $params, array $user): void
    {
        $pdo = Db::pdo();

        $citizenId = !empty($user['citizen_id']) ? (int) $user['citizen_id'] : 0;
        $userId = !empty($user['id']) ? (int) $user['id'] : 0;
        $isAdmin = (($user['role'] ?? '') === 'admin');
        $scope = strtolower((string) (Request::query('scope', '') ?? ''));
        $forceMine = ($scope === 'mine');

        $recentActivity = [];
        if (($forceMine || !$isAdmin) && $userId > 0) {
            $totalPopulation = self::countOwnedCitizens($pdo, $userId);
            $healthRecords = self::countServiceTracking($pdo, 'Health', 'performer', $userId);
            $students = self::countServiceTracking($pdo, 'Education', 'performer', $userId);
            $beneficiaries = self::countServiceTracking($pdo, 'Social Support', 'performer', $userId);

            $stmt = $pdo->prepare('SELECT id, service_category, service_id, action, action_date, notes FROM service_tracking WHERE performed_by = ? ORDER BY action_date DESC LIMIT 10');
            $stmt->execute([$userId]);
            $recentActivity = $stmt->fetchAll();
        } elseif ($citizenId > 0) {
            $totalPopulation = 1;

            $healthRecords = self::countServiceTracking($pdo, 'Health', 'citizen', $citizenId);
            $students = self::countServiceTracking($pdo, 'Education', 'citizen', $citizenId);
            $beneficiaries = self::countServiceTracking($pdo, 'Social Support', 'citizen', $citizenId);

            $stmt = $pdo->prepare('SELECT id, service_category, service_id, action, action_date, notes FROM service_tracking WHERE citizen_id = ? ORDER BY action_date DESC LIMIT 10');
            $stmt->execute([$citizenId]);
            $recentActivity = $stmt->fetchAll();
        } else {
            // global counts for admin/staff dashboards
            $totalPopulation = (int) (($pdo->query("SELECT COUNT(*) AS c FROM citizens WHERE status = 'Active'")->fetch()['c'] ?? 0));
            $healthRecords = self::countServiceTracking($pdo, 'Health');
            $students = self::countServiceTracking($pdo, 'Education');
            $beneficiaries = self::countServiceTracking($pdo, 'Social Support');
        }

        $trend = [];

        // Build default yearly trend (last 12 months) unless overridden by query params
        $range = (string) (Request::query('range', 'year') ?? 'year');
        if ($range === 'year') {
            $now = new DateTime();
            $start = (clone $now)->sub(new DateInterval('P11M'));
            $start->modify('first day of this month')->setTime(0, 0, 0);
            $startSql = $start->format('Y-m-d H:i:s');

            $sql = 'SELECT YEAR(action_date) AS y, MONTH(action_date) AS m, service_category, COUNT(*) AS c FROM service_tracking WHERE action_date >= ?';
            $params = [$startSql];
            if (($forceMine || !$isAdmin) && $userId > 0) {
                $sql .= ' AND performed_by = ?';
                $params[] = $userId;
            } elseif (!empty($user['citizen_id']) && (int) $user['citizen_id'] > 0) {
                $sql .= ' AND citizen_id = ?';
                $params[] = (int) $user['citizen_id'];
            }
            $sql .= ' GROUP BY y,m,service_category ORDER BY y,m';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            // prepare labels for last 12 months
            $labels = [];
            $series = ['Health' => array_fill(0, 12, 0), 'Education' => array_fill(0, 12, 0), 'Social' => array_fill(0, 12, 0)];
            for ($i = 11; $i >= 0; $i--) {
                $d = (clone $now)->sub(new DateInterval('P' . $i . 'M'));
                $labels[] = $d->format('M');
            }

            foreach ($rows as $r) {
                $month = (int) $r['m'];
                $year = (int) $r['y'];
                $cat = (string) ($r['service_category'] ?? '');
                // find index of label matching year-month in our last 12 months
                $index = null;
                for ($i = 0; $i < 12; $i++) {
                    $d = (clone $start)->add(new DateInterval('P' . $i . 'M'));
                    if ((int) $d->format('n') === $month && (int) $d->format('Y') === $year) {
                        $index = $i;
                        break;
                    }
                }
                if ($index === null) {
                    continue;
                }
                if (stripos($cat, 'health') !== false) {
                    $series['Health'][$index] += (int) $r['c'];
                } elseif (stripos($cat, 'education') !== false) {
                    $series['Education'][$index] += (int) $r['c'];
                } else {
                    $series['Social'][$index] += (int) $r['c'];
                }
            }

            $trend = ['range' => 'year', 'labels' => $labels, 'series' => $series];
        } else {
            // month range: expect ?month=YYYY-MM
            $monthParam = (string) (Request::query('month', '') ?? '');
            $now = new DateTime();
            if ($monthParam !== '') {
                try {
                    $now = new DateTime($monthParam . '-01');
                } catch (\Exception $ex) {
                    $now = new DateTime();
                }
            }
            $start = (clone $now)->modify('first day of this month')->setTime(0, 0, 0);
            $end = (clone $now)->modify('last day of this month')->setTime(23, 59, 59);

            $sql = 'SELECT DATE(action_date) AS d, service_category, COUNT(*) AS c FROM service_tracking WHERE action_date BETWEEN ? AND ?';
            $params = [$start->format('Y-m-d H:i:s'), $end->format('Y-m-d H:i:s')];
            if (($forceMine || !$isAdmin) && $userId > 0) {
                $sql .= ' AND performed_by = ?';
                $params[] = $userId;
            } elseif (!empty($user['citizen_id']) && (int) $user['citizen_id'] > 0) {
                $sql .= ' AND citizen_id = ?';
                $params[] = (int) $user['citizen_id'];
            }
            $sql .= ' GROUP BY d,service_category ORDER BY d';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $numDays = (int) $now->format('t');
            $labels = [];
            for ($i = 1; $i <= $numDays; $i++) {
                $labels[] = (string) $i;
            }
            $series = ['Health' => array_fill(0, $numDays, 0), 'Education' => array_fill(0, $numDays, 0), 'Social' => array_fill(0, $numDays, 0)];

            foreach ($rows as $r) {
                $day = (int) (new DateTime($r['d']))->format('j');
                $index = $day - 1;
                $cat = (string) ($r['service_category'] ?? '');
                if (stripos($cat, 'health') !== false) {
                    $series['Health'][$index] += (int) $r['c'];
                } elseif (stripos($cat, 'education') !== false) {
                    $series['Education'][$index] += (int) $r['c'];
                } else {
                    $series['Social'][$index] += (int) $r['c'];
                }
            }

            $trend = ['range' => 'month', 'labels' => $labels, 'series' => $series, 'month' => $now->format('Y-m')];
        }

        Response::json([
            'stats' => [
                ['title' => 'Total Population', 'value' => $totalPopulation, 'change' => '+0.0%', 'trend' => 'up'],
                ['title' => 'Health Records', 'value' => $healthRecords, 'change' => '+0.0%', 'trend' => 'up'],
                ['title' => 'Students Enrolled', 'value' => $students, 'change' => '+0.0%', 'trend' => 'up'],
                ['title' => 'Social Beneficiaries', 'value' => $beneficiaries, 'change' => '+0.0%', 'trend' => 'up'],
            ],
            'recentActivity' => $recentActivity,
            'trend' => $trend,
        ]);
    }

    private static function countServiceTracking(\PDO $pdo, string $category, ?string $scope = null, int $scopeId = 0): int
    {
        $sql = 'SELECT COUNT(*) AS c FROM service_tracking st';
        $args = [];

        if ($scope === 'household' && $scopeId > 0) {
            $sql .= ' JOIN citizens c ON c.id = st.citizen_id WHERE c.household_id = ? AND st.service_category = ?';
            $args = [$scopeId, $category];
        } elseif ($scope === 'citizen' && $scopeId > 0) {
            $sql .= ' WHERE st.citizen_id = ? AND st.service_category = ?';
            $args = [$scopeId, $category];
        } elseif ($scope === 'performer' && $scopeId > 0) {
            $sql .= ' WHERE st.performed_by = ? AND st.service_category = ?';
            $args = [$scopeId, $category];
        } else {
            $sql .= ' WHERE st.service_category = ?';
            $args = [$category];
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($args);
        $row = $stmt->fetch();
        return is_array($row) ? (int) ($row['c'] ?? 0) : 0;
    }

    private static function countOwnedCitizens(\PDO $pdo, int $userId): int
    {
        if ($userId < 1) {
            return 0;
        }
        $stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM user_citizens WHERE user_id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        return is_array($row) ? (int) ($row['c'] ?? 0) : 0;
    }
}
