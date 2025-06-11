<?php
require_once 'config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        errorResponse('Método no permitido', 405);
    }
    
    $db = DatabaseConfig::getInstance();
    $dynamoDb = $db->getDynamoDb();
    $habitsTable = $db->getTableName(Tables::HABITS);
    $recordsTable = $db->getTableName(Tables::RECORDS);
    
    $today = getCurrentDate();
    
    // Obtener todos los hábitos
    $habitsResult = $dynamoDb->scan([
        'TableName' => $habitsTable,
        'FilterExpression' => 'attribute_exists(id)'
    ]);
    
    $habits = [];
    
    foreach ($habitsResult['Items'] as $item) {
        $habitId = $item['id']['S'];
        
        // Obtener progreso de hoy para este hábito
        $todayRecord = null;
        try {
            $recordResult = $dynamoDb->getItem([
                'TableName' => $recordsTable,
                'Key' => [
                    'habitId' => ['S' => $habitId],
                    'date' => ['S' => $today]
                ]
            ]);
            
            if (isset($recordResult['Item'])) {
                $todayRecord = $recordResult['Item'];
            }
        } catch (Exception $e) {
            error_log("Error obteniendo registro de hoy para hábito $habitId: " . $e->getMessage());
        }
        
        $habit = [
            'id' => $habitId,
            'name' => $item['name']['S'],
            'description' => $item['description']['S'] ?? '',
            'type' => $item['type']['S'],
            'target' => isset($item['target']) ? (int)$item['target']['N'] : null,
            'unit' => $item['unit']['S'] ?? null,
            'streak' => isset($item['streak']) ? (int)$item['streak']['N'] : 0,
            'currentValue' => 0,
            'completed' => false
        ];
        
        // Si hay registro de hoy, usar esos valores
        if ($todayRecord) {
            $habit['currentValue'] = isset($todayRecord['value']) ? (int)$todayRecord['value']['N'] : 0;
            $habit['completed'] = isset($todayRecord['completed']) ? $todayRecord['completed']['BOOL'] : false;
        }
        
        // Para hábitos booleanos, ajustar currentValue
        if ($habit['type'] === 'boolean') {
            $habit['currentValue'] = $habit['completed'] ? 1 : 0;
        }
        
        $habits[] = $habit;
    }
    
    // Ordenar hábitos por nombre
    usort($habits, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });
    
    successResponse(['habits' => $habits]);
    
} catch (AwsException $e) {
    error_log("Error DynamoDB en daily-habits.php: " . $e->getMessage());
    errorResponse('Error obteniendo hábitos diarios');
} catch (Exception $e) {
    error_log("Error general en daily-habits.php: " . $e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>
