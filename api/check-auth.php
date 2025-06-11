<?php
require_once 'config.php';

// Iniciar sesión
session_start();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        errorResponse('Método no permitido', 405);
    }
    
    // Verificar si hay una sesión activa
    if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true && isset($_SESSION['user'])) {
        successResponse([
            'authenticated' => true,
            'user' => $_SESSION['user']
        ]);
    } else {
        jsonResponse([
            'authenticated' => false,
            'message' => 'No autenticado'
        ], 401);
    }
    
} catch (Exception $e) {
    error_log("Error en check-auth.php: " . $e->getMessage());
    jsonResponse([
        'authenticated' => false,
        'message' => 'Error verificando autenticación'
    ], 500);
}
?>
