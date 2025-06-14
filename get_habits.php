<?php
session_start();
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;

header('Content-Type: application/json');

if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$email = $_SESSION['email'];

$client = new DynamoDbClient([
    'region'  => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000'
]);

try {
    $result = $client->query([
        'TableName' => 'Habitos',
        'KeyConditionExpression' => 'email = :email',
        'ExpressionAttributeValues' => [
            ':email' => ['S' => $email]
        ]
    ]);

    $habits = [];
    foreach ($result['Items'] as $item) {
        $habits[] = [
            'nombre' => $item['nombre']['S'],
            'descripcion' => $item['descripcion']['S'] ?? '',
            'tipo' => $item['tipo']['S'],
            'meta' => $item['meta']['N'] ?? null,
            'unidad' => $item['unidad']['S'] ?? null,
        ];
    }

    echo json_encode(['success' => true, 'habitos' => $habits]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error al obtener hábitos: ' . $e->getMessage()]);
}
