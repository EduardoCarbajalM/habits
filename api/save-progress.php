<?php
require_once 'config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Método no permitido', 405);
    }
    
    $db = DatabaseConfig::getInstance();
    $dynamoDb = $db->getDynamoDb();
    $recordsTable = $db->getTableName(Tables::RECORDS);
    $habitsTable = $db->getTableName(Tables::HABITS);
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('JSON inválido');
    }
    
    validateRequired($input, ['habitId', 'date', 'value']);
    
    $habitId = $input['habitId'];
    $date = $input['date'];
    $value = $input['value'];
    $completed = $input['completed'] ?? false;
    $notes = trim($input['notes'] ?? '');
    $target = $input['target'] ?? 1;
    
    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        errorResponse('Formato de fecha inválido');
    }
    
    // Verificar que el hábito existe
    $habitResult = $dynamoDb->getItem([
        'TableName' => $habitsTable,
        'Key' => [
            'id' => ['S' => $habitId]
        ]
    ]);
    
    if (!isset($habitResult['Item'])) {
        errorResponse('Hábito no encontrado', 404);
    }
    
    $habit = $habitResult['Item'];
    $currentTime = getCurrentTimestamp();
    
    // Preparar item del registro
    $recordItem = [
        'habitId' => ['S' => $habitId],
        'date' => ['S' => $date],
        'value' => ['N' => (string)$value],
        'completed' => ['BOOL' => $completed],
        'target' => ['N' => (string)$target],
        'createdAt' => ['S' => $currentTime],
        'updatedAt' => ['S' => $currentTime]
    ];
    
    if (!empty($notes)) {
        $recordItem['notes'] = ['S' => $notes];
    }
    
    // Guardar o actualizar registro
    $dynamoDb->putItem([
        'TableName' => $recordsTable,
        'Item' => $recordItem
    ]);
    
    // Actualizar estadísticas del hábito
    updateHabitStats($dynamoDb, $habitsTable, $recordsTable, $habitId);
    
    successResponse([
        'record' => [
            'habitId' => $habitId,
            'date' => $date,
            'value' => $value,
            'completed' => $completed,
            'target' => $target,
            'notes' => $notes
        ]
    ], 'Progreso guardado exitosamente');
    
} catch (AwsException $e) {
    error_log("Error DynamoDB en save-progress.php: " . $e->getMessage());
    errorResponse('Error guardando progreso en la base de datos');
} catch (Exception $e) {
    error_log("Error general en save-progress.php: " . $e->getMessage());
    errorResponse('Error interno del servidor', 500);
}

function updateHabitStats($dynamoDb, $habitsTable, $recordsTable, $habitId) {
    try {
        // Obtener todos los registros del hábito
        $records = $dynamoDb->query([
            'TableName' => $recordsTable,
            'KeyConditionExpression' => 'habitId = :habitId',
            'ExpressionAttributeValues' => [
                ':habitId' => ['S' => $habitId]
            ]
        ]);
        
        $completedRecords = [];
        $totalDays = 0;
        
        foreach ($records['Items'] as $record) {
            $totalDays++;
            if ($record['completed']['BOOL']) {
                $completedRecords[] = $record['date']['S'];
            }
        }
        
        // Calcular racha actual y mejor racha
        $currentStreak = calculateCurrentStreak($completedRecords);
        $bestStreak = calculateBestStreak($completedRecords);
        
        // Actualizar hábito
        $dynamoDb->updateItem([
            'TableName' => $habitsTable,
            'Key' => [
                'id' => ['S' => $habitId]
            ],
            'UpdateExpression' => 'SET streak = :streak, bestStreak = :bestStreak, totalDays = :totalDays, updatedAt = :updatedAt',
            'ExpressionAttributeValues' => [
                ':streak' => ['N' => (string)$currentStreak],
                ':bestStreak' => ['N' => (string)max($bestStreak, $currentStreak)],
                ':totalDays' => ['N' => (string)$totalDays],
                ':updatedAt' => ['S' => getCurrentTimestamp()]
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error actualizando estadísticas del hábito: " . $e->getMessage());
    }
}

function calculateCurrentStreak($completedDates) {
    if (empty($completedDates)) return 0;
    
    // Ordenar fechas de más reciente a más antigua
    rsort($completedDates);
    
    $today = new DateTime();
    $streak = 0;
    
    foreach ($completedDates as $dateStr) {
        $date = new DateTime($dateStr);
        $daysDiff = $today->diff($date)->days;
        
        if ($daysDiff === $streak) {
            $streak++;
            $today->sub(new DateInterval('P1D'));
        } else {
            break;
        }
    }
    
    return $streak;
}

function calculateBestStreak($completedDates) {
    if (empty($completedDates)) return 0;
    
    sort($completedDates);
    
    $bestStreak = 1;
    $currentStreak = 1;
    $prevDate = new DateTime($completedDates[0]);
    
    for ($i = 1; $i < count($completedDates); $i++) {
        $currentDate = new DateTime($completedDates[$i]);
        $daysDiff = $prevDate->diff($currentDate)->days;
        
        if ($daysDiff === 1) {
            $currentStreak++;
            $bestStreak = max($bestStreak, $currentStreak);
        } else {
            $currentStreak = 1;
        }
        
        $prevDate = $currentDate;
    }
    
    return $bestStreak;
}
?>
