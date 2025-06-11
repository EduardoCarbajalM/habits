<?php
require_once 'config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Método no permitido', 405);
    }
    
    $db = DatabaseConfig::getInstance();
    $dynamoDb = $db->getDynamoDb();
    $recordsTable = $db->getTableName(Tables::RECORDS);
    $dailyNotesTable = $db->getTableName(Tables::DAILY_NOTES);
    $habitsTable = $db->getTableName(Tables::HABITS);
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('JSON inválido');
    }
    
    validateRequired($input, ['date', 'habits']);
    
    $date = $input['date'];
    $habits = $input['habits'];
    $notes = trim($input['notes'] ?? '');
    
    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        errorResponse('Formato de fecha inválido');
    }
    
    $currentTime = getCurrentTimestamp();
    $savedRecords = [];
    
    // Procesar cada hábito
    foreach ($habits as $habitData) {
        if (!isset($habitData['id']) || !isset($habitData['value'])) {
            continue;
        }
        
        $habitId = $habitData['id'];
        $value = $habitData['value'];
        $completed = $habitData['completed'] ?? false;
        $target = $habitData['target'] ?? 1;
        
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
        
        try {
            // Guardar registro del hábito
            $dynamoDb->putItem([
                'TableName' => $recordsTable,
                'Item' => $recordItem
            ]);
            
            $savedRecords[] = [
                'habitId' => $habitId,
                'date' => $date,
                'value' => $value,
                'completed' => $completed
            ];
            
            // Actualizar estadísticas del hábito
            updateHabitStats($dynamoDb, $habitsTable, $recordsTable, $habitId);
            
        } catch (AwsException $e) {
            error_log("Error guardando registro para hábito $habitId: " . $e->getMessage());
        }
    }
    
    // Guardar notas diarias si existen
    if (!empty($notes)) {
        try {
            $notesItem = [
                'date' => ['S' => $date],
                'notes' => ['S' => $notes],
                'createdAt' => ['S' => $currentTime],
                'updatedAt' => ['S' => $currentTime]
            ];
            
            $dynamoDb->putItem([
                'TableName' => $dailyNotesTable,
                'Item' => $notesItem
            ]);
        } catch (AwsException $e) {
            error_log("Error guardando notas diarias: " . $e->getMessage());
        }
    }
    
    successResponse([
        'savedRecords' => $savedRecords,
        'notesaved' => !empty($notes)
    ], 'Registro diario guardado exitosamente');
    
} catch (Exception $e) {
    error_log("Error general en save-daily-log.php: " . $e->getMessage());
    errorResponse('Error interno del servidor', 500);
}

function updateHabitStats($dynamoDb, $habitsTable, $recordsTable, $habitId) {
    try {
        // Obtener todos los registros del hábito ordenados por fecha
        $records = $dynamoDb->query([
            'TableName' => $recordsTable,
            'KeyConditionExpression' => 'habitId = :habitId',
            'ExpressionAttributeValues' => [
                ':habitId' => ['S' => $habitId]
            ],
            'ScanIndexForward' => false // Orden descendente por fecha
        ]);
        
        $completedDates = [];
        $totalDays = 0;
        
        foreach ($records['Items'] as $record) {
            $totalDays++;
            if ($record['completed']['BOOL']) {
                $completedDates[] = $record['date']['S'];
            }
        }
        
        // Calcular rachas
        $currentStreak = calculateCurrentStreak($completedDates);
        $bestStreak = calculateBestStreak($completedDates);
        
        // Obtener la mejor racha actual del hábito
        $habitResult = $dynamoDb->getItem([
            'TableName' => $habitsTable,
            'Key' => [
                'id' => ['S' => $habitId]
            ],
            'ProjectionExpression' => 'bestStreak'
        ]);
        
        $currentBestStreak = 0;
        if (isset($habitResult['Item']['bestStreak'])) {
            $currentBestStreak = (int)$habitResult['Item']['bestStreak']['N'];
        }
        
        $newBestStreak = max($currentBestStreak, $bestStreak, $currentStreak);
        
        // Actualizar estadísticas del hábito
        $dynamoDb->updateItem([
            'TableName' => $habitsTable,
            'Key' => [
                'id' => ['S' => $habitId]
            ],
            'UpdateExpression' => 'SET streak = :streak, bestStreak = :bestStreak, totalDays = :totalDays, updatedAt = :updatedAt',
            'ExpressionAttributeValues' => [
                ':streak' => ['N' => (string)$currentStreak],
                ':bestStreak' => ['N' => (string)$newBestStreak],
                ':totalDays' => ['N' => (string)$totalDays],
                ':updatedAt' => ['S' => getCurrentTimestamp()]
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error actualizando estadísticas del hábito $habitId: " . $e->getMessage());
    }
}

function calculateCurrentStreak($completedDates) {
    if (empty($completedDates)) return 0;
    
    // Ordenar fechas de más reciente a más antigua
    rsort($completedDates);
    
    $today = new DateTime();
    $streak = 0;
    $checkDate = clone $today;
    
    foreach ($completedDates as $dateStr) {
        $completedDate = new DateTime($dateStr);
        
        // Si la fecha coincide con la fecha que estamos verificando
        if ($completedDate->format('Y-m-d') === $checkDate->format('Y-m-d')) {
            $streak++;
            $checkDate->sub(new DateInterval('P1D'));
        } else {
            // Si hay un gap, terminar la racha
            break;
        }
    }
    
    return $streak;
}

function calculateBestStreak($completedDates) {
    if (empty($completedDates)) return 0;
    
    // Ordenar fechas de más antigua a más reciente
    sort($completedDates);
    
    $bestStreak = 1;
    $currentStreak = 1;
    
    for ($i = 1; $i < count($completedDates); $i++) {
        $prevDate = new DateTime($completedDates[$i - 1]);
        $currentDate = new DateTime($completedDates[$i]);
        
        $daysDiff = $prevDate->diff($currentDate)->days;
        
        if ($daysDiff === 1) {
            // Días consecutivos
            $currentStreak++;
            $bestStreak = max($bestStreak, $currentStreak);
        } else {
            // Reiniciar racha
            $currentStreak = 1;
        }
    }
    
    return $bestStreak;
}
?>
