<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Request;
use App\Response;

final class ReportsControllerExtended
{
    /** @param array<string,string> $params */
    public static function generateReport(array $params, array $user = []): void
    {
        $body = Request::json();
        $type = $body['type'] ?? '';
        $format = $body['format'] ?? 'PDF';
        $department = isset($body['department']) && is_string($body['department']) ? trim($body['department']) : 'all';
        $period = isset($body['period']) && is_string($body['period']) ? trim($body['period']) : 'monthly';
        $filters = $body['filters'] ?? [];

        if (!in_array($type, ['population', 'health', 'education', 'social_services', 'department'])) {
            Response::json(['error' => 'Invalid report type'], 400);
            return;
        }

        if (!in_array($format, ['PDF', 'Excel', 'CSV'])) {
            Response::json(['error' => 'Invalid format'], 400);
            return;
        }

        try {
            $pdo = Db::pdo();
            $data = self::fetchReportData($pdo, $type, $filters);
            
            if ($format === 'PDF') {
                $filePath = self::generatePDFReport($type, $data, $filters);
            } elseif ($format === 'Excel') {
                $filePath = self::generateExcelReport($type, $data, $filters);
            } else {
                $filePath = self::generateCSVReport($type, $data, $filters);
            }

            // Store report record using the current schema
            $reportName = ucfirst($type) . ' Report';
            $normalizedFormat = strtoupper($format) === 'EXCEL' || strtoupper($format) === 'CSV' ? 'EXCEL' : 'PDF';
            $fileSize = file_exists($filePath) ? self::humanFileSize((int) filesize($filePath)) : '0 KB';
            $stmt = $pdo->prepare('INSERT INTO reports (name, department, period, file_type, file_size, generated_at) VALUES (?, ?, ?, ?, ?, NOW())');
            $stmt->execute([$reportName, $department, $period, $normalizedFormat, $fileSize]);

            Response::json([
                'message' => 'Report generated successfully',
                'file_path' => $filePath,
                'download_url' => "/api/reports/download/" . basename($filePath)
            ]);

        } catch (\Exception $e) {
            error_log("Report generation error: " . $e->getMessage());
            Response::json(['error' => 'Failed to generate report: ' . $e->getMessage()], 500);
        }
    }

    private static function humanFileSize(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 KB';
        }
        if ($bytes < 1024 * 1024) {
            return number_format($bytes / 1024, 1) . ' KB';
        }
        return number_format($bytes / (1024 * 1024), 2) . ' MB';
    }

    /** @param array<string,string> $params */
    public static function downloadReport(array $params): void
    {
        $filename = $params['filename'] ?? '';
        
        if (empty($filename)) {
            Response::json(['error' => 'Filename required'], 400);
            return;
        }

        $filePath = __DIR__ . '/../../reports/' . basename($filename);
        
        if (!file_exists($filePath)) {
            Response::json(['error' => 'File not found'], 404);
            return;
        }

        $fileInfo = pathinfo($filePath);
        $mimeType = self::getMimeType($fileInfo['extension']);

        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: private, no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');

        readfile($filePath);
        exit;
    }

    /** @param array<string,string> $params */
    public static function getPriorityCases(array $params, array $user): void
    {
        try {
            $pdo = Db::pdo();
            $cid = !empty($user['citizen_id']) ? (int) $user['citizen_id'] : null;
            $householdId = !empty($user['household_id']) ? (int) $user['household_id'] : null;
            if (!empty($params['household_id'])) {
                $householdId = (int) $params['household_id'];
            }

            // Get priority cases from different services, scoped to citizen if available
            $priorityCases = [
                'health' => self::getHealthPriorityCases($pdo, $cid, $householdId),
                'education' => self::getEducationPriorityCases($pdo, $cid, $householdId),
                'social_services' => self::getSocialServicesPriorityCases($pdo, $cid, $householdId)
            ];

            Response::json([
                'priority_cases' => $priorityCases,
                'total_count' => array_sum(array_map('count', $priorityCases))
            ]);

        } catch (\Exception $e) {
            Response::json(['error' => 'Failed to fetch priority cases'], 500);
        }
    }

    /** @param array<string,string> $params */
    public static function updatePriorityCase(array $params): void
    {
        $body = Request::json();
        $caseId = $body['case_id'] ?? '';
        $caseType = $body['case_type'] ?? '';
        $action = $body['action'] ?? '';
        $notes = $body['notes'] ?? '';

        if (empty($caseId) || empty($caseType) || empty($action)) {
            Response::json(['error' => 'Case ID, type, and action are required'], 400);
            return;
        }

        try {
            $pdo = Db::pdo();
            
            switch ($caseType) {
                case 'health':
                    $stmt = $pdo->prepare('UPDATE health_services SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?');
                    break;
                case 'education':
                    $stmt = $pdo->prepare('UPDATE education_services SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?');
                    break;
                case 'social_services':
                    $stmt = $pdo->prepare('UPDATE social_services SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?');
                    break;
                default:
                    Response::json(['error' => 'Invalid case type'], 400);
                    return;
            }

            $stmt->execute([$action, $notes, $caseId]);

            // Log the action
            $userId = $_SESSION['user_id'] ?? null;
            $logStmt = $pdo->prepare('INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
            $logStmt->execute([$userId, "Updated priority case", $caseType . "_services", $caseId, json_encode(['status' => $action, 'notes' => $notes])]);

            Response::json(['message' => 'Priority case updated successfully']);

        } catch (\Exception $e) {
            Response::json(['error' => 'Failed to update priority case'], 500);
        }
    }

    private static function fetchReportData(\PDO $pdo, string $type, array $filters): array
    {
        switch ($type) {
            case 'population':
                return self::getPopulationData($pdo, $filters);
            case 'health':
                return self::getHealthData($pdo, $filters);
            case 'education':
                return self::getEducationData($pdo, $filters);
            case 'social_services':
                return self::getSocialServicesData($pdo, $filters);
            default:
                return [];
        }
    }

    private static function getPopulationData(\PDO $pdo, array $filters): array
    {
        $sql = "SELECT 
                    c.ward, 
                    COUNT(*) as total_citizens,
                    SUM(CASE WHEN c.gender = 'Male' THEN 1 ELSE 0 END) as males,
                    SUM(CASE WHEN c.gender = 'Female' THEN 1 ELSE 0 END) as females,
                    AVG(c.age) as avg_age
                FROM citizens c 
                WHERE c.status = 'Active'";
        
        $params = [];
        if (!empty($filters['household_id'])) {
            $sql .= " AND c.household_id = ?";
            $params[] = (int) $filters['household_id'];
        }
        if (!empty($filters['ward'])) {
            $sql .= " AND c.ward = ?";
            $params[] = $filters['ward'];
        }
        
        $sql .= " GROUP BY c.ward ORDER BY c.ward";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private static function getHealthData(\PDO $pdo, array $filters): array
    {
        $sql = "SELECT 
                    hs.service_type,
                    COUNT(*) as total_visits,
                    COUNT(DISTINCT hs.citizen_id) as unique_patients,
                    hs.facility_name
                FROM health_services hs
                JOIN citizens c ON hs.citizen_id = c.id
                WHERE hs.service_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        
        $params = [];
        if (!empty($filters['household_id'])) {
            $sql .= " AND c.household_id = ?";
            $params[] = (int) $filters['household_id'];
        }
        if (!empty($filters['facility'])) {
            $sql .= " AND hs.facility_name = ?";
            $params[] = $filters['facility'];
        }
        
        $sql .= " GROUP BY hs.service_type, hs.facility_name ORDER BY hs.service_type";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private static function getEducationData(\PDO $pdo, array $filters): array
    {
        $sql = "SELECT 
                    es.institution_level,
                    es.institution_name,
                    COUNT(*) as total_enrollments,
                    COUNT(DISTINCT es.citizen_id) as unique_students
                FROM education_services es
                JOIN citizens c ON es.citizen_id = c.id
                WHERE es.service_type = 'Enrollment'";
        
        $params = [];
        if (!empty($filters['household_id'])) {
            $sql .= " AND c.household_id = ?";
            $params[] = (int) $filters['household_id'];
        }
        if (!empty($filters['level'])) {
            $sql .= " AND es.institution_level = ?";
            $params[] = $filters['level'];
        }
        
        $sql .= " GROUP BY es.institution_level, es.institution_name ORDER BY es.institution_level";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private static function getSocialServicesData(\PDO $pdo, array $filters): array
    {
        $sql = "SELECT 
                    ss.service_type,
                    ss.program_name,
                    COUNT(*) as total_beneficiaries,
                    SUM(ss.amount) as total_amount
                FROM social_services ss
                JOIN citizens c ON ss.citizen_id = c.id
                WHERE ss.status = 'Active'";
        
        $params = [];
        if (!empty($filters['household_id'])) {
            $sql .= " AND c.household_id = ?";
            $params[] = (int) $filters['household_id'];
        }
        if (!empty($filters['service_type'])) {
            $sql .= " AND ss.service_type = ?";
            $params[] = $filters['service_type'];
        }
        
        $sql .= " GROUP BY ss.service_type, ss.program_name ORDER BY ss.service_type";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private static function generatePDFReport(string $type, array $data, array $filters): string
    {
        $filename = $type . '_report_' . date('Y-m-d_H-i-s') . '.pdf';
        $filePath = __DIR__ . '/../../reports/' . $filename;
        
        // Ensure reports directory exists
        if (!is_dir(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }
        
        $title = ucfirst(str_replace('_', ' ', $type)) . ' Report';
        $generatedAt = date('Y-m-d H:i:s');
        $department = isset($filters['department']) && is_string($filters['department']) ? $filters['department'] : 'All Departments';
        $period = isset($filters['period']) && is_string($filters['period']) ? $filters['period'] : 'Default';

        // Simple PDF generation using TCPDF (if available) or native minimal PDF fallback.
        if (class_exists('TCPDF')) {
            $pdfClass = '\\TCPDF';
            $pdf = new $pdfClass();
            $pdf->AddPage();
            $pdf->SetAutoPageBreak(true, 15);

            $logoPath = self::resolveLogoPath();
            if ($logoPath !== null) {
                $pdf->Image($logoPath, 15, 12, 16, 16, 'PNG');
            }

            $pdf->SetFont('helvetica', 'B', 14);
            $pdf->Cell(0, 8, 'CPMS - County Government', 0, 1, 'L', false, '', 0, false, 'T', 'M');
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 8, $title, 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(0, 6, 'Generated: ' . $generatedAt . ' | Department: ' . $department . ' | Period: ' . $period, 0, 1, 'L');
            $pdf->Ln(4);

            if (!empty($data)) {
                $headers = array_keys($data[0]);
                $tableHtml = '<table border="1" cellpadding="4" cellspacing="0" width="100%"><thead><tr style="background-color:#f0f0f0;">';
                foreach ($headers as $header) {
                    $tableHtml .= '<th><b>' . htmlspecialchars(ucfirst(str_replace('_', ' ', (string) $header)), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</b></th>';
                }
                $tableHtml .= '</tr></thead><tbody>';

                foreach ($data as $row) {
                    $tableHtml .= '<tr>';
                    foreach ($row as $value) {
                        $tableHtml .= '<td>' . htmlspecialchars(self::normalizeReportCellValue($value), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</td>';
                    }
                    $tableHtml .= '</tr>';
                }
                $tableHtml .= '</tbody></table>';

                $pdf->writeHTML($tableHtml, true, false, true, false, '');
            } else {
                $pdf->Cell(0, 8, 'No data available for the selected report filters.', 0, 1, 'L');
            }
            
            $pdf->Output($filePath, 'F');
        } else {
            $lines = [
                'CPMS - County Government',
                $title,
                'Generated: ' . $generatedAt,
                'Department: ' . $department,
                'Period: ' . $period,
                '',
            ];

            if (!empty($data)) {
                $headers = array_map(
                    static fn($header): string => ucfirst(str_replace('_', ' ', (string) $header)),
                    array_keys($data[0])
                );
                $rows = [];

                foreach ($data as $row) {
                    $cells = [];
                    foreach ($row as $value) {
                        $cells[] = self::normalizeReportCellValue($value);
                    }
                    $rows[] = $cells;
                }

                $lines = array_merge($lines, self::buildTextTableLines($headers, $rows, 150));
            } else {
                $lines[] = 'No data available for the selected report filters.';
            }

            $pdfBinary = self::buildSimplePdf($lines);
            file_put_contents($filePath, $pdfBinary);
        }
        
        return $filename;
    }

    private static function normalizeReportCellValue(mixed $value): string
    {
        if (is_array($value) || is_object($value)) {
            return (string) json_encode($value);
        }

        if ($value === null) {
            return '';
        }

        return (string) $value;
    }

    /**
     * @param array<int,string> $headers
     * @param array<int,array<int,string>> $rows
     * @return array<int,string>
     */
    private static function buildTextTableLines(array $headers, array $rows, int $maxWidth = 150): array
    {
        $colCount = max(1, count($headers));
        $separator = ' | ';
        $separatorWidth = strlen($separator) * ($colCount - 1);
        $colWidth = max(10, (int) floor(($maxWidth - $separatorWidth) / $colCount));

        $formatRow = static function (array $cells) use ($colCount, $colWidth, $separator): string {
            $out = [];
            for ($i = 0; $i < $colCount; $i++) {
                $cell = (string) ($cells[$i] ?? '');
                if (strlen($cell) > $colWidth) {
                    $cell = substr($cell, 0, max(0, $colWidth - 3)) . '...';
                }
                $out[] = str_pad($cell, $colWidth, ' ');
            }
            return implode($separator, $out);
        };

        $lines = [];
        $lines[] = $formatRow($headers);
        $lines[] = str_repeat('-', min($maxWidth, strlen($lines[0])));
        foreach ($rows as $row) {
            $lines[] = $formatRow($row);
        }

        return $lines;
    }

    /**
     * @param array<int,string> $lines
     */
    private static function buildSimplePdf(array $lines): string
    {
        $maxLines = 45;
        $visibleLines = array_slice($lines, 0, $maxLines);

        $content = "BT\n40 780 Td\n";

        foreach ($visibleLines as $index => $line) {
            if ($index === 0) {
                $content .= "/F1 14 Tf\n16 TL\n";
            } elseif ($index === 1) {
                $content .= "/F1 12 Tf\n15 TL\n";
            } elseif ($index >= 2 && $index <= 4) {
                $content .= "/F1 10 Tf\n13 TL\n";
            } elseif ($index === 6) {
                $content .= "T*\n/F2 9 Tf\n12 TL\n";
            }

            $content .= '(' . self::escapePdfText($line) . ") Tj\nT*\n";
        }

        $content .= "ET\n";

        $objects = [];
        $objects[] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
        $objects[] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
        $objects[] = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >>\nendobj\n";
        $objects[] = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
        $objects[] = "5 0 obj\n<< /Length " . strlen($content) . " >>\nstream\n" . $content . "endstream\nendobj\n";
        $objects[] = "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $index => $object) {
            $offsets[$index + 1] = strlen($pdf);
            $pdf .= $object;
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }

        $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n" . $xrefOffset . "\n%%EOF";

        return $pdf;
    }

    private static function escapePdfText(string $text): string
    {
        $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
        $escaped = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $escaped);
        return is_string($escaped) ? $escaped : '';
    }

    private static function resolveLogoPath(): ?string
    {
        $logoPath = realpath(__DIR__ . '/../../../public/images/logo.png');
        if ($logoPath === false || !file_exists($logoPath)) {
            return null;
        }
        return $logoPath;
    }

    private static function generateExcelReport(string $type, array $data, array $filters): string
    {
        $filename = $type . '_report_' . date('Y-m-d_H-i-s') . '.xlsx';
        $filePath = __DIR__ . '/../../reports/' . $filename;
        
        // Ensure reports directory exists
        if (!is_dir(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }
        
        // Simple Excel generation using PHPExcel (if available) or fallback to CSV
        if (class_exists('PHPExcel')) {
            $spreadsheetClass = '\\PHPExcel';
            $objPHPExcel = new $spreadsheetClass();
            $objPHPExcel->getProperties()->setTitle(ucfirst($type) . ' Report');
            
            $sheet = $objPHPExcel->getActiveSheet();
            $sheet->setTitle(ucfirst($type));
            
            // Add headers
            if (!empty($data)) {
                $col = 'A';
                foreach (array_keys($data[0]) as $header) {
                    $sheet->setCellValue($col . '1', ucfirst(str_replace('_', ' ', $header)));
                    $col++;
                }
                
                // Add data
                $row = 2;
                foreach ($data as $rowData) {
                    $col = 'A';
                    foreach ($rowData as $value) {
                        $sheet->setCellValue($col . $row, $value);
                        $col++;
                    }
                    $row++;
                }
            }
            
            $writerFactoryClass = '\\PHPExcel_IOFactory';
            $objWriter = $writerFactoryClass::createWriter($objPHPExcel, 'Excel2007');
            $objWriter->save($filePath);
        } else {
            // Fallback to CSV format
            return self::generateCSVReport($type, $data, $filters);
        }
        
        return $filename;
    }

    private static function generateCSVReport(string $type, array $data, array $filters): string
    {
        $filename = $type . '_report_' . date('Y-m-d_H-i-s') . '.csv';
        $filePath = __DIR__ . '/../../reports/' . $filename;
        
        // Ensure reports directory exists
        if (!is_dir(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }
        
        $file = fopen($filePath, 'w');
        
        // Add headers
        if (!empty($data)) {
            fputcsv($file, array_keys($data[0]));
            
            // Add data
            foreach ($data as $row) {
                fputcsv($file, $row);
            }
        }
        
        fclose($file);
        
        return $filename;
    }

    private static function getHealthPriorityCases(\PDO $pdo, ?int $citizenId = null, ?int $householdId = null): array
    {
        $sql = "SELECT hs.id, hs.service_type, hs.service_description, hs.service_date,
                   c.full_name, c.phone, hs.facility_name, hs.status
            FROM health_services hs
            JOIN citizens c ON hs.citizen_id = c.id
            WHERE hs.service_type IN ('Emergency Care', 'Chronic Disease')
            AND hs.status IN ('Scheduled', 'Pending')
            AND hs.service_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $params = [];
        if ($citizenId !== null) {
            $sql .= ' AND hs.citizen_id = ?';
            $params[] = $citizenId;
        } elseif ($householdId !== null) {
            $sql .= ' AND c.household_id = ?';
            $params[] = $householdId;
        }
        $sql .= ' ORDER BY hs.service_date ASC LIMIT 10';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private static function getEducationPriorityCases(\PDO $pdo, ?int $citizenId = null, ?int $householdId = null): array
    {
        $sql = "SELECT es.id, es.service_type, es.institution_name, es.service_date,
                   c.full_name, c.phone, es.status, es.grade_level
            FROM education_services es
            JOIN citizens c ON es.citizen_id = c.id
            WHERE es.service_type IN ('Dropout', 'Transfer')
            AND es.status IN ('Active', 'Pending')";
        $params = [];
        if ($citizenId !== null) {
            $sql .= ' AND es.citizen_id = ?';
            $params[] = $citizenId;
        } elseif ($householdId !== null) {
            $sql .= ' AND c.household_id = ?';
            $params[] = $householdId;
        }
        $sql .= ' ORDER BY es.service_date DESC LIMIT 10';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private static function getSocialServicesPriorityCases(\PDO $pdo, ?int $citizenId = null, ?int $householdId = null): array
    {
        $sql = "SELECT ss.id, ss.service_type, ss.program_name, ss.start_date,
                   c.full_name, c.phone, ss.status, ss.amount
            FROM social_services ss
            JOIN citizens c ON ss.citizen_id = c.id
            WHERE ss.service_type IN ('Cash Transfer', 'Food Assistance', 'Housing Support')
            AND ss.status = 'Active'
            AND ss.end_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)";
        $params = [];
        if ($citizenId !== null) {
            $sql .= ' AND ss.citizen_id = ?';
            $params[] = $citizenId;
        } elseif ($householdId !== null) {
            $sql .= ' AND c.household_id = ?';
            $params[] = $householdId;
        }
        $sql .= ' ORDER BY ss.end_date ASC LIMIT 10';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private static function getReportDescription(string $type, array $filters): string
    {
        $description = ucfirst($type) . ' report';
        if (!empty($filters)) {
            $description .= ' with filters: ' . json_encode($filters);
        }
        return $description;
    }

    private static function getMimeType(string $extension): string
    {
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv' => 'text/csv',
            'html' => 'text/html'
        ];
        
        return $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
    }
}
