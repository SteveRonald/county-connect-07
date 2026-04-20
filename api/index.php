<?php

declare(strict_types=1);

require __DIR__ . '/src/bootstrap.php';

use App\Router;
use App\Response;
use App\Env;

error_log('REQUEST_URI: ' . ($_SERVER['REQUEST_URI'] ?? 'not set'));
error_log('REQUEST_METHOD: ' . ($_SERVER['REQUEST_METHOD'] ?? 'not set'));

$router = new Router();

$router->post('/auth/login', [App\Controllers\AuthController::class, 'login']);
$router->post('/auth/register', [App\Controllers\AuthController::class, 'register']);
$router->get('/auth/me', [App\Controllers\AuthController::class, 'me'], true);

// Password reset endpoints
$router->post('/auth/forgot-password', [App\Controllers\AuthControllerExtended::class, 'forgotPassword']);
$router->post('/auth/verify-otp', [App\Controllers\AuthControllerExtended::class, 'verifyOTP']);
$router->post('/auth/reset-password', [App\Controllers\AuthControllerExtended::class, 'resetPassword']);

$router->get('/dashboard/summary', [App\Controllers\DashboardController::class, 'summary'], true);

$router->get('/citizens', [App\Controllers\CitizensController::class, 'index'], true);
$router->post('/citizens', [App\Controllers\CitizensController::class, 'create'], true);
$router->get('/citizens/{id}', [App\Controllers\CitizensController::class, 'show'], true);
$router->put('/citizens/{id}', [App\Controllers\CitizensController::class, 'update'], true);
$router->delete('/citizens/{id}', [App\Controllers\CitizensController::class, 'delete'], true);

$router->get('/users', [App\Controllers\UsersController::class, 'index'], true);
$router->post('/users', [App\Controllers\UsersController::class, 'create'], true);
$router->get('/users/{id}', [App\Controllers\UsersController::class, 'show'], true);
$router->put('/users/{id}', [App\Controllers\UsersController::class, 'update'], true);
$router->delete('/users/{id}', [App\Controllers\UsersController::class, 'delete'], true);

$router->get('/demographics/summary', [App\Controllers\DemographicsController::class, 'summary'], true);
$router->get('/health/summary', [App\Controllers\HealthController::class, 'summary'], true);
$router->get('/education/summary', [App\Controllers\EducationController::class, 'summary'], true);
$router->get('/social-services/summary', [App\Controllers\SocialServicesController::class, 'summary'], true);

$router->get('/reports/templates', [App\Controllers\ReportsController::class, 'templates'], true);
$router->get('/reports/recent', [App\Controllers\ReportsController::class, 'recent'], true);
$router->post('/reports/generate', [App\Controllers\ReportsControllerExtended::class, 'generateReport'], true);
$router->get('/reports/download/{filename}', [App\Controllers\ReportsControllerExtended::class, 'downloadReport']);
$router->get('/reports/priority-cases', [App\Controllers\ReportsControllerExtended::class, 'getPriorityCases'], true);
$router->post('/reports/priority-cases/update', [App\Controllers\ReportsControllerExtended::class, 'updatePriorityCase'], true);

$router->get('/facilities/health', [App\Controllers\FacilitiesController::class, 'healthFacilities'], false);
$router->get('/facilities/education', [App\Controllers\FacilitiesController::class, 'educationFacilities'], false);
$router->get('/facilities/social-programs', [App\Controllers\FacilitiesController::class, 'socialPrograms'], false);
$router->post('/facilities/health', [App\Controllers\FacilitiesController::class, 'createHealthFacility'], true);
$router->post('/facilities/education', [App\Controllers\FacilitiesController::class, 'createEducationFacility'], true);
$router->post('/facilities/social-programs', [App\Controllers\FacilitiesController::class, 'createSocialProgram'], true);
$router->get('/appointment-requests', [App\Controllers\AppointmentRequestsController::class, 'index'], true);
$router->post('/appointment-requests', [App\Controllers\AppointmentRequestsController::class, 'create'], true);
$router->put('/appointment-requests/{id}/status', [App\Controllers\AppointmentRequestsController::class, 'updateStatus'], true);

$router->get('/admin/appointment-requests', [App\Controllers\AdminAppointmentsController::class, 'allAppointments'], true);
$router->get('/admin/appointment-requests/pending', [App\Controllers\AdminAppointmentsController::class, 'pendingAppointments'], true);
$router->post('/admin/appointment-requests/{id}/approve', [App\Controllers\AdminAppointmentsController::class, 'approveAppointment'], true);
$router->post('/admin/appointment-requests/{id}/reject', [App\Controllers\AdminAppointmentsController::class, 'rejectAppointment'], true);

$router->get('/settings', [App\Controllers\SettingsController::class, 'get'], true);
$router->put('/settings', [App\Controllers\SettingsController::class, 'update'], true);

try {
    $router->dispatch();
} catch (Throwable $e) {
    error_log('Global exception: ' . $e->getMessage());
    @file_put_contents(
        __DIR__ . '/error.log',
        '[' . date('c') . '] ' . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n\n",
        FILE_APPEND
    );

    $debug = Env::get('APP_DEBUG', '0') === '1';
    if ($debug) {
        Response::json([
            'error' => 'server_error',
            'message' => $e->getMessage(),
        ], 500);
    }

    Response::json(['error' => 'server_error'], 500);
}
