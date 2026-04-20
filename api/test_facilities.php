<?php
require_once __DIR__ . '/src/bootstrap.php';

try {
    $pdo = \App\Db::pdo();
    $stmt = $pdo->prepare("SELECT id, name, type, level, ward, sub_county, address, phone, email, services_offered, capacity FROM health_facilities WHERE status = ? ORDER BY name");
    $stmt->execute(['Active']);
    $rows = $stmt->fetchAll();
    echo "Success! Found " . count($rows) . " facilities:\n";
    print_r($rows);
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}
?>