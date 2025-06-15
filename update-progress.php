<?php
require 'vendor/autoload.php';
use Aws\DynamoDb\DynamoDbClient;

// Configuración del cliente DynamoDB
$client = new DynamoDbClient([
    'region'  => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000'
]);

// Obtener datos del request
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos']);
    exit;
}

try {
    // Para hábitos numéricos
    if ($data['type'] === 'numeric') {
        $seguimientoId = $data['seguimientoId'] ?? uniqid('seg_');
        
        $result = $client->updateItem([
            'TableName' => 'HabitosSeguimiento',
            'Key' => [
                'seguimientoId' => ['S' => $seguimientoId]
            ],
            'UpdateExpression' => 'SET userId = :u, habitId = :h, fecha = :f ADD valor :v',
            'ExpressionAttributeValues' => [
                ':u' => ['S' => $data['userId']],
                ':h' => ['S' => $data['habitId']],
                ':f' => ['S' => date('Y-m-d')],
                ':v' => ['N' => $data['change']]
            ],
            'ReturnValues' => 'ALL_NEW'
        ]);
        
        $currentValue = $result['Attributes']['valor']['N'];
        
        // Obtener target del hábito (consulta a UsuarioHabitos)
        $targetResult = $client->query([
            'TableName' => 'UsuarioHabitos',
            'IndexName' => 'UserHabitsIndex',
            'KeyConditionExpression' => 'userId = :u AND habitId = :h',
            'ExpressionAttributeValues' => [
                ':u' => ['S' => $data['userId']],
                ':h' => ['S' => $data['habitId']]
            ],
            'Limit' => 1
        ]);
        
        if (!empty($targetResult['Items'])) {
            $target = $targetResult['Items'][0]['customTarget']['N'] ?? $targetResult['Items'][0]['defaultTarget']['N'] ?? 1;
            
            if ($currentValue >= $target) {
                // Marcar como completado si alcanza el target
                $client->updateItem([
                    'TableName' => 'HabitosSeguimiento',
                    'Key' => [
                        'seguimientoId' => ['S' => $seguimientoId]
                    ],
                    'UpdateExpression' => 'SET completado = :c',
                    'ExpressionAttributeValues' => [
                        ':c' => ['BOOL' => true]
                    ]
                ]);
            }
        }
    } 
    // Para hábitos booleanos
    else {
        $client->putItem([
            'TableName' => 'HabitosSeguimiento',
            'Item' => [
                'seguimientoId' => ['S' => uniqid('seg_')],
                'userId' => ['S' => $data['userId']],
                'habitId' => ['S' => $data['habitId']],
                'fecha' => ['S' => date('Y-m-d')],
                'completado' => ['BOOL' => $data['completed']],
                'ultimaActualizacion' => ['S' => date('c')]
            ]
        ]);
    }
    
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al actualizar progreso',
        'details' => $e->getMessage()
    ]);
}