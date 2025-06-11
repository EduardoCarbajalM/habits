<?php
require_once 'config.php';

// Iniciar sesión
session_start();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Método no permitido', 405);
    }
    
    // Destruir la sesión
    $_SESSION = array();
    
    // Eliminar cookie de sesión
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    // Destruir la sesión
    session_destroy();
    
    successResponse([], 'Sesión cerrada correctamente');
    
} catch (Exception $e) {
    error_log("Error en logout.php: " . $e->getMessage());
    errorResponse('Error cerrando sesión', 500);
}
?>
