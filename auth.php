<?php
session_start();
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;
use Aws\DynamoDb\Exception\DynamoDbException;

header('Content-Type: application/json');

$client = new DynamoDbClient([
    'region'  => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000'
]);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos']);
    exit();
}

try {
    $result = $client->getItem([
        'TableName' => 'Usuarios',
        'Key' => ['email' => ['S' => $email]]
    ]);
    
    if (!isset($result['Item'])) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit();
    }

    $storedPassword = $result['Item']['password']['S'];

    if ($password === $storedPassword) {
        $_SESSION['email'] = $email;
        echo json_encode(['success' => true, 'message' => 'Login exitoso']);
        exit();
    } else {
        echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
        exit();
    }
} catch (DynamoDbException $e) {
    echo json_encode(['success' => false, 'message' => 'Error en DB: ' . $e->getMessage()]);
    exit();
}
