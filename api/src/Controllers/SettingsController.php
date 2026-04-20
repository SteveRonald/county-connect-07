<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Request;
use App\Response;

final class SettingsController
{
    /** @param array<string,string> $params */
    public static function get(array $params, array $user): void
    {
        $pdo = Db::pdo();
        $rows = $pdo->query('SELECT setting_key, setting_value FROM settings')->fetchAll();

        $out = [];
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $k = (string) ($row['setting_key'] ?? '');
            $v = (string) ($row['setting_value'] ?? '');
            if ($k !== '') {
                $out[$k] = $v;
            }
        }

        Response::json(['data' => $out]);
    }

    /** @param array<string,string> $params */
    public static function update(array $params, array $user): void
    {
        $body = Request::json();
        if (!$body) {
            Response::json(['ok' => true]);
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');

        foreach ($body as $k => $v) {
            if (!is_string($k)) {
                continue;
            }
            if (!is_scalar($v) && $v !== null) {
                continue;
            }
            $stmt->execute([$k, $v === null ? '' : (string) $v]);
        }

        Response::json(['ok' => true]);
    }
}
