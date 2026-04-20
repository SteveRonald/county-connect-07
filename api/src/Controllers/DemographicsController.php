<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Response;

final class DemographicsController
{
    /** @param array<string,string> $params */
    public static function summary(array $params, array $user): void
    {
        $pdo = Db::pdo();

        $total = (int) (($pdo->query("SELECT COUNT(*) AS c FROM citizens")->fetch()['c'] ?? 0));
        $active = (int) (($pdo->query("SELECT COUNT(*) AS c FROM citizens WHERE status = 'Active'")->fetch()['c'] ?? 0));
        $deceased = (int) (($pdo->query("SELECT COUNT(*) AS c FROM citizens WHERE status = 'Deceased'")->fetch()['c'] ?? 0));

        $wards = $pdo->query("SELECT ward, COUNT(*) AS population FROM citizens GROUP BY ward ORDER BY ward ASC")->fetchAll();

        Response::json([
            'stats' => [
                ['title' => 'Total Population', 'value' => $total],
                ['title' => 'Active', 'value' => $active],
                ['title' => 'Deceased', 'value' => $deceased],
            ],
            'populationByWard' => $wards,
        ]);
    }
}
