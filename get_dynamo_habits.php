<?php
session_start();
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;

if (!isset($_SESSION['email'])) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

$client = new DynamoDbClient([
    'region'  => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000'
]);

$userEmail = $_SESSION['email'];
$today = date('Y-m-d');

try {
    // 1. Obtener hábitos del usuario
    $userHabits = $client->query([
        'TableName' => 'UsuarioHabitos',
        'IndexName' => 'UserHabitsIndex',
        'KeyConditionExpression' => 'userId = :userId',
        'ExpressionAttributeValues' => [':userId' => ['S' => $userEmail]]
    ])['Items'];

    $habits = [];
    
    foreach ($userHabits as $userHabit) {
        $habitId = $userHabit['habitId']['S'] ?? '';
        
        // 2. Obtener detalles del hábito
        $habitDetails = $client->getItem([
            'TableName' => 'Habitos',
            'Key' => ['habitId' => ['S' => $habitId]]
        ])['Item'] ?? [];
        
        // 3. Obtener progreso de hoy
        $dailyProgress = $client->query([
            'TableName' => 'HabitosSeguimiento',
            'IndexName' => 'UserHabitDateIndex',
            'KeyConditionExpression' => 'userId = :userId AND fecha = :fecha',
            'ExpressionAttributeValues' => [
                ':userId' => ['S' => $userEmail],
                ':fecha' => ['S' => $today]
            ]
        ])['Items'][0] ?? []; // Tomar el primer registro si existe
        
        // Combinar datos
        $habits[] = [
            'userHabit' => $userHabit,
            'habitDetails' => $habitDetails,
            'dailyProgress' => $dailyProgress
        ];
    }
    
    echo json_encode([
        'success' => true,
        'habits' => $habits
    ]);
    
} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener hábitos: ' . $e->getMessage()
    ]);
}
?>