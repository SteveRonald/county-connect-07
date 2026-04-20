<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/test';
require __DIR__ . '/src/bootstrap.php';
try {
    $pdo = App\Db::pdo();
    $stmt = $pdo->query('DESCRIBE health_facilities');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo 'Columns in health_facilities table:' . PHP_EOL;
    foreach ($columns as $col) {
        echo $col['Field'] . ' - ' . $col['Type'] . PHP_EOL;
    }
} catch (Throwable $e) {
    echo 'ERROR: ' . $e->getMessage();
}
