<?php
require 'vendor/autoload.php';
use Aws\DynamoDb\DynamoDbClient;
use Aws\DynamoDb\Marshaler;

// Configurar DynamoDB local
$client = new DynamoDbClient([
    'region' => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000',
]);

$marshaler = new Marshaler();

// Obtener los datos del formulario
$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? null;
$habitName = $data['habitName'] ?? null;
$habitDescription = $data['habitDescription'] ?? '';
$habitType = $data['habitType'] ?? null;
$habitTarget = $data['habitTarget'] ?? null;
$habitUnit = $data['habitUnit'] ?? null;
$habitReminder = $data['habitReminder'] ?? false;
$reminderTime = $data['reminderTimeInput'] ?? null;

if (!$email || !$habitName || !$habitType) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan datos obligatorios.']);
    exit;
}

$habitId = uniqid('hab_', true);

$item = [
    'email' => $email,
    'habitId' => $habitId,
    'nombre' => $habitName,
    'descripcion' => $habitDescription,
    'tipo' => $habitType,
    'activo' => true,
    'recordatorio' => $habitReminder,
];

if ($habitType === 'numeric') {
    $item['meta'] = (int)$habitTarget;
    $item['unidad'] = $habitUnit;
}

if ($habitReminder && $reminderTime) {
    $item['hora_recordatorio'] = $reminderTime;
}

try {
    $client->putItem([
        'TableName' => 'Habitos',
        'Item' => $marshaler->marshalItem($item),
    ]);
    echo json_encode(['success' => true, 'habitId' => $habitId]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
