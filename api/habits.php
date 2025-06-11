<?php
require_once 'config.php';
require_once 'middleware.php';

try {
    // Requerir autenticación para todos los endpoints
    $currentUser = requireAuth();
    $userId = $currentUser['id'];
    
    $db = DatabaseConfig::getInstance();
    $dynamoDb = $db->getDynamoDb();
    $tableName = $db->getTableName(Tables::HABITS);
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getHabits($dynamoDb, $tableName, $userId);
            break;
        case 'POST':
            createHabit($dynamoDb, $tableName, $userId);
            break;
        case 'PUT':
            updateHabit($dynamoDb, $tableName, $userId);
            break;
        case 'DELETE':
            deleteHabit($dynamoDb, $tableName, $userId);
            break;
        default:
            errorResponse('Método no permitido', 405);
    }
} catch (Exception $e) {
    error_log("Error en habits.php: " . $e->getMessage());
    errorResponse('Error interno del servidor', 500);
}

function getHabits($dynamoDb, $tableName, $userId) {
    try {
        // Obtener solo los hábitos del usuario autenticado
        $result = $dynamoDb->scan([
            'TableName' => $tableName,
            'FilterExpression' => 'userId = :userId',
            'ExpressionAttributeValues' => [
                ':userId' => ['S' => $userId]
            ]
        ]);
        
        $habits = [];
        foreach ($result['Items'] as $item) {
            $habit = [
                'id' => $item['id']['S'],
                'name' => $item['name']['S'],
                'description' => $item['description']['S'] ?? '',
                'type' => $item['type']['S'],
                'target' => isset($item['target']) ? (int)$item['target']['N'] : null,
                'unit' => $item['unit']['S'] ?? null,
                'streak' => isset($item['streak']) ? (int)$item['streak']['N'] : 0,
                'bestStreak' => isset($item['bestStreak']) ? (int)$item['bestStreak']['N'] : 0,
                'totalDays' => isset($item['totalDays']) ? (int)$item['totalDays']['N'] : 0,
                'reminder' => isset($item['reminder']) ? (bool)$item['reminder']['BOOL'] : false,
                'reminderTime' => $item['reminderTime']['S'] ?? null,
                'createdAt' => $item['createdAt']['S'],
                'updatedAt' => $item['updatedAt']['S'] ?? null
            ];
            
            // Obtener progreso de hoy
            $habit['todayProgress'] = getTodayProgress($dynamoDb, $habit['id']);
            $habit['completed'] = checkIfCompleted($habit);
            
            $habits[] = $habit;
        }
        
        successResponse(['habits' => $habits]);
        
    } catch (AwsException $e) {
        error_log("Error DynamoDB en getHabits: " . $e->getMessage());
        errorResponse('Error obteniendo hábitos');
    }
}

function createHabit($dynamoDb, $tableName, $userId) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        validateRequired($input, ['name', 'type']);
        
        if ($input['type'] === 'numeric') {
            validateRequired($input, ['target', 'unit']);
        }
        
        $habitId = $input['id'] ?? generateUUID();
        $currentTime = getCurrentTimestamp();
        
        $item = [
            'id' => ['S' => $habitId],
            'userId' => ['S' => $userId], // Agregar userId
            'name' => ['S' => $input['name']],
            'description' => ['S' => $input['description'] ?? ''],
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
            $item['unit'] = ['S' => $input['unit']];
        }
        
        if (!empty($input['reminderTime'])) {
            $item['reminderTime'] = ['S' => $input['reminderTime']];
        }
        
        $dynamoDb->putItem([
            'TableName' => $tableName,
            'Item' => $item
        ]);
        
        successResponse(['habitId' => $habitId], 'Hábito creado exitosamente');
        
    } catch (AwsException $e) {
        error_log("Error DynamoDB en createHabit: " . $e->getMessage());
        errorResponse('Error creando hábito');
    }
}

// Resto de las funciones con verificación de userId...
function updateHabit($dynamoDb, $tableName, $userId) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        validateRequired($input, ['id']);
        
        // Verificar que el hábito pertenece al usuario
        $habit = $dynamoDb->getItem([
            'TableName' => $tableName,
            'Key' => [
                'id' => ['S' => $input['id']]
            ]
        ]);
        
        if (!isset($habit['Item'])) {
            errorResponse('Hábito no encontrado', 404);
        }
        
        if ($habit['Item']['userId']['S'] !== $userId) {
            errorResponse('No tienes permisos para modificar este hábito', 403);
        }
        
        $updateExpression = 'SET updatedAt = :updatedAt';
        $expressionAttributeValues = [
            ':updatedAt' => ['S' => getCurrentTimestamp()]
        ];
        
        // Construir expresión de actualización dinámicamente
        $fieldsToUpdate = ['name', 'description', 'type', 'target', 'unit', 'reminder', 'reminderTime'];
        
        foreach ($fieldsToUpdate as $field) {
            if (isset($input[$field])) {
                $updateExpression .= ", $field = :$field";
                
                switch ($field) {
                    case 'target':
                        $expressionAttributeValues[":$field"] = ['N' => (string)$input[$field]];
                        break;
                    case 'reminder':
                        $expressionAttributeValues[":$field"] = ['BOOL' => $input[$field]];
                        break;
                    default:
                        $expressionAttributeValues[":$field"] = ['S' => $input[$field]];
                }
            }
        }
        
        $dynamoDb->updateItem([
            'TableName' => $tableName,
            'Key' => [
                'id' => ['S' => $input['id']]
            ],
            'UpdateExpression' => $updateExpression,
            'ExpressionAttributeValues' => $expressionAttributeValues
        ]);
        
        successResponse([], 'Hábito actualizado exitosamente');
        
    } catch (AwsException $e) {
        error_log("Error DynamoDB en updateHabit: " . $e->getMessage());
        errorResponse('Error actualizando hábito');
    }
}

function deleteHabit($dynamoDb, $tableName, $userId) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        validateRequired($input, ['id']);
        
        // Verificar que el hábito pertenece al usuario
        $habit = $dynamoDb->getItem([
            'TableName' => $tableName,
            'Key' => [
                'id' => ['S' => $input['id']]
            ]
        ]);
        
        if (!isset($habit['Item'])) {
            errorResponse('Hábito no encontrado', 404);
        }
        
        if ($habit['Item']['userId']['S'] !== $userId) {
            errorResponse('No tienes permisos para eliminar este hábito', 403);
        }
        
        $dynamoDb->deleteItem([
            'TableName' => $tableName,
            'Key' => [
                'id' => ['S' => $input['id']]
            ]
        ]);
        
        successResponse([], 'Hábito eliminado exitosamente');
        
    } catch (AwsException $e) {
        error_log("Error DynamoDB en deleteHabit: " . $e->getMessage());
        errorResponse('Error eliminando hábito');
    }
}

function getTodayProgress($dynamoDb, $habitId) {
    try {
        $db = DatabaseConfig::getInstance();
        $recordsTable = $db->getTableName(Tables::RECORDS);
        $today = getCurrentDate();
        
        $result = $dynamoDb->getItem([
            'TableName' => $recordsTable,
            'Key' => [
                'habitId' => ['S' => $habitId],
                'date' => ['S' => $today]
            ]
        ]);
        
        if (isset($result['Item'])) {
            return isset($result['Item']['value']) ? (int)$result['Item']['value']['N'] : 0;
        }
        
        return 0;
        
    } catch (AwsException $e) {
        error_log("Error obteniendo progreso de hoy: " . $e->getMessage());
        return 0;
    }
}

function checkIfCompleted($habit) {
    if ($habit['type'] === 'boolean') {
        return $habit['todayProgress'] > 0;
    } else {
        return $habit['todayProgress'] >= ($habit['target'] ?? 1);
    }
}
?>
