<?php
require_once 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;
use Aws\Exception\AwsException;

class DatabaseConfig {
    private static $instance = null;
    private $dynamoDb;
    
    private function __construct() {
        $this->initializeDynamoDb();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function initializeDynamoDb() {
        try {
            $this->dynamoDb = new DynamoDbClient([
                'region' => $_ENV['AWS_REGION'] ?? 'us-east-1',
                'version' => 'latest',
                'credentials' => [
                    'key' => $_ENV['AWS_ACCESS_KEY_ID'],
                    'secret' => $_ENV['AWS_SECRET_ACCESS_KEY'],
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error inicializando DynamoDB: " . $e->getMessage());
            throw new Exception("Error de configuración de base de datos");
        }
    }
    
    public function getDynamoDb() {
        return $this->dynamoDb;
    }
    
    public function getTableName($table) {
        $prefix = $_ENV['TABLE_PREFIX'] ?? 'habit_tracker_';
        return $prefix . $table;
    }
}

// Configuración de tablas
class Tables {
    const HABITS = 'habits';
    const RECORDS = 'records';
    const USERS = 'users';
    const DAILY_NOTES = 'daily_notes';
}

// Configuración de respuestas JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Función helper para respuestas JSON
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Función helper para errores
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['success' => false, 'message' => $message], $statusCode);
}

// Función helper para éxito
function successResponse($data = [], $message = 'Operación exitosa') {
    jsonResponse(array_merge(['success' => true, 'message' => $message], $data));
}

// Función para validar datos requeridos
function validateRequired($data, $required) {
    $missing = [];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        errorResponse('Campos requeridos faltantes: ' . implode(', ', $missing));
    }
}

// Función para generar UUID
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Función para obtener fecha actual
function getCurrentDate() {
    return date('Y-m-d');
}

// Función para obtener timestamp actual
function getCurrentTimestamp() {
    return date('Y-m-d H:i:s');
}
?>
