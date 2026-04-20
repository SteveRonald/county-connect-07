<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/test';
require __DIR__ . '/src/bootstrap.php';
try {
    $pdo = App\Db::pdo();
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM health_facilities');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Health facilities count: " . $result['count'] . "\n";

    $stmt2 = $pdo->query('SELECT name FROM health_facilities LIMIT 3');
    $facilities = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    echo "Sample facilities:\n";
    foreach ($facilities as $facility) {
        echo "- " . $facility['name'] . "\n";
    }
} catch (Throwable $e) {
    echo 'ERROR: ' . $e->getMessage();
}
