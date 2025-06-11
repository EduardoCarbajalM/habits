<?php
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;
use Aws\DynamoDb\Exception\DynamoDbException;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$client = new DynamoDbClient([
    'region' => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000',
]);

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Completa todos los campos']);
    exit;
}

try {
    $response = $client->getItem([
        'TableName' => 'Usuarios',
        'Key' => [
            'email' => ['S' => $email]
        ]
    ]);

    if (!isset($response['Item'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario o contraseña incorrectos']);
        exit;
    }

    $passwordStored = $response['Item']['password']['S'];

    if ($password === $passwordStored) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario o contraseña incorrectos']);
    }

} catch (DynamoDbException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}
