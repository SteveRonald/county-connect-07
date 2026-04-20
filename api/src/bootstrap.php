<?php

declare(strict_types=1);

require __DIR__ . "/Env.php";
require __DIR__ . "/Db.php";
require __DIR__ . "/Auth.php";
require __DIR__ . "/Jwt.php";
require __DIR__ . "/Request.php";
require __DIR__ . "/Response.php";
require __DIR__ . "/Router.php";

// Load .env values for DB/JWT configuration before controllers execute.
App\Env::load(__DIR__ . '/../.env');

// Load controllers
require __DIR__ . "/Controllers/AuthController.php";
require __DIR__ . "/Controllers/AuthControllerExtended.php";
require __DIR__ . "/Controllers/DashboardController.php";
require __DIR__ . "/Controllers/CitizensController.php";
require __DIR__ . "/Controllers/DemographicsController.php";
require __DIR__ . "/Controllers/HealthController.php";
require __DIR__ . "/Controllers/EducationController.php";
require __DIR__ . "/Controllers/SocialServicesController.php";
require __DIR__ . "/Controllers/ReportsController.php";
require __DIR__ . "/Controllers/ReportsControllerExtended.php";
require __DIR__ . "/Controllers/AppointmentRequestsController.php";
require __DIR__ . "/Controllers/AdminAppointmentsController.php";
require __DIR__ . "/Controllers/UsersController.php";
require __DIR__ . "/Controllers/FacilitiesController.php";
require __DIR__ . "/Controllers/SettingsController.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    App\Response::json(['ok' => true], 204);
}
