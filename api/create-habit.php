<?php
require_once 'config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Método no permitido', 405);
    }
    
    $db = DatabaseConfig::getInstance();
    $dynamoDb = $db->getDynamoDb();
    $tableName = $db->getTableName(Tables::HABITS);
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('JSON inválido');
    }
    
    validateRequired($input, ['name', 'type']);
    
    if ($input['type'] === 'numeric') {
        validateRequired($input, ['target', 'unit']);
        
        if ($input['target'] <= 0) {
            errorResponse('La meta debe ser mayor a 0');
        }
    }
    
    $habitId = $input['id'] ?? generateUUID();
    $currentTime = getCurrentTimestamp();
    
    $item = [
        'id' => ['S' => $habitId],
        'name' => ['S' => trim($input['name'])],
        'description' => ['S' => trim($input['description'] ?? '')],
        'type' => ['S' => $input['type']],
        'streak' => ['N' => '0'],
        'bestStreak' => ['N' => '0'],
        'totalDays' => ['N' => '0'],
        'reminder' => ['BOOL' => $input['reminder'] ?? false],
        'createdAt' => ['S' => $currentTime],
        'updatedAt' => ['S' => $currentTime]
    ];
    
    if ($input['type'] === 'numeric') {
        $item['target'] = ['N' => (string)$input['target']];
        $item['unit'] = ['S' => trim($input['unit'])];
    }
    
    if (!empty($input['reminderTime'])) {
        $item['reminderTime'] = ['S' => $input['reminderTime']];
    }
    
    // Verificar si ya existe un hábito con el mismo nombre
    $existingHabit = $dynamoDb->scan([
        'TableName' => $tableName,
        'FilterExpression' => '#name = :name',
        'ExpressionAttributeNames' => [
            '#name' => 'name'
        ],
        'ExpressionAttributeValues' => [
            ':name' => ['S' => trim($input['name'])]
        ]
    ]);
    
    if ($existingHabit['Count'] > 0) {
        errorResponse('Ya existe un hábito con ese nombre');
    }
    
    $dynamoDb->putItem([
        'TableName' => $tableName,
        'Item' => $item,
        'ConditionExpression' => 'attribute_not_exists(id)'
    ]);
    
    successResponse([
        'habitId' => $habitId,
        'habit' => [
            'id' => $habitId,
            'name' => trim($input['name']),
            'description' => trim($input['description'] ?? ''),
            'type' => $input['type'],
            'target' => $input['type'] === 'numeric' ? $input['target'] : null,
            'unit' => $input['type'] === 'numeric' ? trim($input['unit']) : null,
            'streak' => 0,
            'bestStreak' => 0,
            'totalDays' => 0,
            'reminder' => $input['reminder'] ?? false,
            'reminderTime' => $input['reminderTime'] ?? null,
            'createdAt' => $currentTime
        ]
    ], 'Hábito creado exitosamente');
    
} catch (AwsException $e) {
    error_log("Error DynamoDB en create-habit.php: " . $e->getMessage());
    
    if ($e->getAwsErrorCode() === 'ConditionalCheckFailedException') {
        errorResponse('El hábito ya existe');
    } else {
        errorResponse('Error creando hábito en la base de datos');
    }
} catch (Exception $e) {
    error_log("Error general en create-habit.php: " . $e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>
