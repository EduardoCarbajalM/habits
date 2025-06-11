<?php
// Middleware de autenticación para proteger endpoints

function requireAuth() {
    // Iniciar sesión si no está iniciada
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Verificar autenticación
    if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true || !isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'No autenticado',
            'redirect' => 'login.html'
        ]);
        exit();
    }
    
    return $_SESSION['user'];
}

function getCurrentUserId() {
    $user = requireAuth();
    return $user['id'];
}

function getCurrentUser() {
    return requireAuth();
}

// Función para verificar si el usuario es propietario del recurso
function verifyOwnership($resourceUserId, $currentUserId = null) {
    if ($currentUserId === null) {
        $currentUserId = getCurrentUserId();
    }
    
    if ($resourceUserId !== $currentUserId) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'No tienes permisos para acceder a este recurso'
        ]);
        exit();
    }
}

// Función para agregar userId a los datos automáticamente
function addUserIdToData($data) {
    $userId = getCurrentUserId();
    $data['userId'] = $userId;
    return $data;
}
?>
