<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Db;
use App\Env;
use App\Jwt;
use App\Request;
use App\Response;

final class AuthControllerExtended
{
    private static function generateOTP(): string
    {
        return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private static function storeOTP(string $email, string $otp): void
    {
        $pdo = Db::pdo();
        
        // Delete any existing OTP for this email
        $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
        
        // Store new OTP with 15 minute expiry
        $stmt = $pdo->prepare('INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))');
        $stmt->execute([$email, $otp]);
    }

    private static function validateOTP(string $email, string $otp): bool
    {
        $pdo = Db::pdo();
        $stmt = $pdo->prepare('SELECT id FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() LIMIT 1');
        $stmt->execute([$email, $otp]);
        return $stmt->fetch() !== false;
    }

    private static function clearOTP(string $email): void
    {
        $pdo = Db::pdo();
        $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
    }

    /** @param array<string,string> $params */
    public static function forgotPassword(array $params): void
    {
        $body = Request::json();
        $email = $body['email'] ?? '';

        if ($email === '') {
            Response::json(['error' => 'Email is required'], 400);
            return;
        }

        $pdo = Db::pdo();
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        
        if (!$stmt->fetch()) {
            // Don't reveal if email exists or not for security
            Response::json(['message' => 'If the email exists, an OTP will be sent'], 200);
            return;
        }

        $otp = self::generateOTP();
        self::storeOTP($email, $otp);

        // In production, send email with OTP
        // For demo, we'll log it (in real app, use proper email service)
        error_log("OTP for {$email}: {$otp}");
        
        Response::json([
            'message' => 'OTP sent successfully',
            'debug_otp' => $otp // Remove in production
        ]);
    }

    /** @param array<string,string> $params */
    public static function verifyOTP(array $params): void
    {
        $body = Request::json();
        $email = $body['email'] ?? '';
        $otp = $body['otp'] ?? '';

        if ($email === '' || $otp === '') {
            Response::json(['error' => 'Email and OTP are required'], 400);
            return;
        }

        if (!self::validateOTP($email, $otp)) {
            Response::json(['error' => 'Invalid or expired OTP'], 401);
            return;
        }

        Response::json(['message' => 'OTP verified successfully']);
    }

    /** @param array<string,string> $params */
    public static function resetPassword(array $params): void
    {
        $body = Request::json();
        $email = $body['email'] ?? '';
        $otp = $body['otp'] ?? '';
        $password = $body['password'] ?? '';

        if ($email === '' || $otp === '' || $password === '') {
            Response::json(['error' => 'Email, OTP, and password are required'], 400);
            return;
        }

        if (!self::validateOTP($email, $otp)) {
            Response::json(['error' => 'Invalid or expired OTP'], 401);
            return;
        }

        if (strlen($password) < 6) {
            Response::json(['error' => 'Password must be at least 6 characters long'], 400);
            return;
        }

        $pdo = Db::pdo();
        
        // Get user
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            Response::json(['error' => 'User not found'], 404);
            return;
        }

        // Update password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$passwordHash, $user['id']]);

        // Clear OTP
        self::clearOTP($email);

        Response::json(['message' => 'Password reset successfully']);
    }
}
