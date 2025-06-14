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

if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// Validación básica
if (!$data || !isset($data['habitName'], $data['habitType'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit();
}

try {
    $userId = $_SESSION['email'];
    $habitId = $data['isCustom'] ? bin2hex(random_bytes(16)) : $data['habitId'];
    $currentDate = date('Y-m-d\TH:i:s\Z');
    
    // 1. Insertar en UsuarioHabitos
    $client->putItem([
        'TableName' => 'UsuarioHabitos',
        'Item' => [
            'userHabitId' => ['S' => uniqid()],
            'userId' => ['S' => $userId],
            'habitId' => ['S' => $habitId],
            'customTarget' => ['N' => (string)($data['habitTarget'] ?? '0')],
            'customUnit' => ['S' => $data['habitUnit'] ?? ''],
            'reminderTime' => ['S' => $data['reminderTimeInput'] ?? ''],
            'active' => ['BOOL' => true],
            'createdAt' => ['S' => $currentDate],
            'streak' => ['N' => '0'],
            'bestStreak' => ['N' => '0']
        ]
    ]);

    // 2. Si es hábito personalizado, agregar a Habitos
    if ($data['isCustom']) {
        $habitData = [
            'habitId' => ['S' => $habitId],
            'name' => ['S' => $data['habitName']],
            'description' => ['S' => $data['habitDescription'] ?? ''],
            'type' => ['S' => $data['habitType']],
            'createdAt' => ['S' => $currentDate],
            'category' => ['S' => 'personalizado']
        ];

        if ($data['habitType'] === 'numeric') {
            $habitData['defaultTarget'] = ['N' => (string)$data['habitTarget']];
            $habitData['defaultUnit'] = ['S' => $data['habitUnit']];
        }

        $client->putItem([
            'TableName' => 'Habitos',
            'Item' => $habitData
        ]);
    }

    echo json_encode(['success' => true, 'message' => 'Hábito guardado correctamente']);
} catch (DynamoDbException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al guardar: '.$e->getMessage()]);
}