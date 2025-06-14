<?php
session_start();
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;

if (!isset($_SESSION['email'])) {
    header('Location: login.html');
    exit();
}

$client = new DynamoDbClient([
    'region'  => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000'
]);

$userEmail = $_SESSION['email'];

// Consulta usando el índice UserHabitsIndex
$result = $client->scan([
    'TableName' => 'UsuarioHabitos',
    'FilterExpression' => 'userId = :userId',
    'ExpressionAttributeValues' => [
        ':userId' => ['S' => $userEmail]
    ]
]);

$userHabits = $client->query([
    'TableName' => 'UsuarioHabitos',
    'IndexName' => 'UserHabitsIndex',
    'KeyConditionExpression' => 'userId = :userId',
    'ExpressionAttributeValues' => [':userId' => ['S' => $userEmail]]
])['Items'];

// Obtener progreso de hoy
$today = date('Y-m-d');
$dailyProgress = $client->query([
    'TableName' => 'HabitosSeguimiento',
    'IndexName' => 'UserHabitDateIndex',
    'KeyConditionExpression' => 'userId = :userId AND fecha = :fecha',
    'ExpressionAttributeValues' => [
        ':userId' => ['S' => $userEmail],
        ':fecha' => ['S' => $today]
    ]
])['Items'];

// Función para obtener valores seguros de DynamoDB
function getDynamoValue($item, $key, $type, $default = null) {
    return $item[$key][$type] ?? $default;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Seguimiento de Hábitos</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        /* Controles numéricos mejorados */
        .numeric-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-left: auto;
        }

        .btn-numeric {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background-color: var(--primary-blue);
            color: var(--white);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: var(--shadow);
        }

        .btn-numeric:hover {
            background-color: #2563eb;
            transform: translateY(-1px);
            box-shadow: var(--shadow-lg);
        }

        .btn-numeric:active {
            transform: translateY(0);
        }

        .btn-numeric i {
            font-size: 0.8rem;
        }

        /* Para hábitos numéricos específicamente */
        .habit-item[data-habit-type="numeric"] {
            padding: 1rem 1.5rem;
            align-items: center;
        }

        .habit-item[data-habit-type="numeric"] .habit-info {
            flex: 1;
            min-width: 0; /* Permite que el texto se ajuste correctamente */
        }

        .habit-item[data-habit-type="numeric"] .habit-progress-text {
            font-size: 0.875rem;
            color: var(--gray-700);
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .habit-item[data-habit-type="numeric"] .habit-progress {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-left: 1rem;
        }

        .habit-item[data-habit-type="numeric"] .progress-bar {
            width: 100px;
            height: 6px;
            background: var(--gray-200);
            border-radius: 3px;
        }

        .habit-item[data-habit-type="numeric"] .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary-blue), var(--primary-green));
            border-radius: 3px;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <div class="header-info">
                    <h1 class="header-title">
                        <i class="fas fa-chart-line"></i>
                        Dashboard de Hábitos
                    </h1>
                    <p class="header-date" id="currentDate"></p>
                </div>
                <button class="btn btn-secondary" onclick="window.location.href='logout.php'">
                    <i class="fas fa-sign-out-alt"></i>
                    Cerrar sesión
                </button>
                <button class="btn btn-primary" onclick="window.location.href='add-habit.php'">
                    <i class="fas fa-plus"></i>
                    Nuevo Hábito
                </button>
            </div>
        </header>

        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="stat-card stat-blue">
                <div class="stat-header">
                    <span class="stat-label">Hábitos Totales</span>
                    <i class="fas fa-target"></i>
                </div>
                <div class="stat-value" id="totalHabits"><?= count($userHabits) ?></div>
            </div>

            <div class="stat-card stat-green">
                <div class="stat-header">
                    <span class="stat-label">Completados Hoy</span>
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-value" id="completedToday">0/<?= count($userHabits) ?></div>
                <div class="progress-bar">
                    <div class="progress-fill" id="completionProgress"></div>
                </div>
            </div>

            <div class="stat-card stat-purple">
                <div class="stat-header">
                    <span class="stat-label">Mejor Racha</span>
                    <i class="fas fa-award"></i>
                </div>
                <div class="stat-value" id="bestStreak">0 días</div>
            </div>

            <div class="stat-card stat-orange">
                <div class="stat-header">
                    <span class="stat-label">Progreso Semanal</span>
                    <i class="fas fa-trending-up"></i>
                </div>
                <div class="stat-value" id="weeklyProgress">0%</div>
            </div>
        </div>

        <div class="main-grid">
            <!-- Hábitos de Hoy -->
            <div class="main-content">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Hábitos de Hoy</h2>
                        <p class="card-description">Progreso de tus hábitos para hoy</p>
                    </div>
                    <div class="card-content">
                        <div id="habitsContainer" class="habits-list">
                            <?php if (empty($userHabits)): ?>
                                <div class="empty-state">
                                    <i class="fas fa-plus-circle" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                                    <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">No tienes hábitos aún</h3>
                                    <p style="color: var(--gray-500); margin-bottom: 1rem;">Crea tu primer hábito para comenzar</p>
                                    <a href="add-habit.php" class="btn btn-primary">
                                        <i class="fas fa-plus"></i> Crear Hábito
                                    </a>
                                </div>
                            <?php else: ?>
                                <?php 
                                // Obtener detalles de los hábitos desde la tabla Habitos
                                $habitDetails = [];
                                foreach ($userHabits as $userHabit) {
                                    $habitId = $userHabit['habitId']['S'] ?? '';
                                    if ($habitId) {
                                        $result = $client->getItem([
                                            'TableName' => 'Habitos',
                                            'Key' => [
                                                'habitId' => ['S' => $habitId]
                                            ]
                                        ]);
                                        $habitDetails[$habitId] = $result['Item'] ?? [];
                                    }
                                }
                                ?>
                                
                                <?php foreach ($userHabits as $userHabit): ?>
                                    <?php
                                    $habitId = $userHabit['habitId']['S'] ?? '';
                                    $habit = $habitDetails[$habitId] ?? [];
                                    
                                    // Obtener valores del hábito base
                                    $name = $habit['name']['S'] ?? 'Nuevo Hábito';
                                    $type = $habit['type']['S'] ?? 'boolean';
                                    $defaultTarget = $habit['defaultTarget']['N'] ?? 1;
                                    $defaultUnit = $habit['defaultUnit']['S'] ?? '';
                                    
                                    // Obtener valores personalizados del usuario
                                    $customTarget = $userHabit['customTarget']['N'] ?? $defaultTarget;
                                    $customUnit = $userHabit['customUnit']['S'] ?? $defaultUnit;
                                    $streak = $userHabit['streak']['N'] ?? 0;
                                    $completed = false;
                                    $todayProgress = 0; // Necesitarías un campo para trackear progreso diario
                                    ?>
                                    
                                    <div class="habit-item">
                                        <div class="habit-info">
                                            <i class="fas fa-<?= $completed ? 'check-circle' : 'circle' ?> habit-icon <?= $completed ? '' : 'incomplete' ?>"></i>
                                            <div class="habit-details">
                                                <h3><?= htmlspecialchars($name) ?></h3>
                                                <div class="habit-meta">
                                                    <span class="habit-badge">
                                                        🔥 <?= $streak ?> días
                                                    </span>
                                                    <?php if ($type === 'numeric'): ?>
                                                        <span class="habit-progress-text">
                                                            <?= $todayProgress ?>/<?= $customTarget ?> <?= htmlspecialchars($customUnit) ?>
                                                        </span>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        </div>
                                        <?php if ($type === 'numeric'): ?>
                                            <div class="habit-progress">
                                                <div class="progress-bar" style="width: 80px;">
                                                    <div class="progress-fill" style="width: <?= ($todayProgress / $customTarget) * 100 ?>%"></div>
                                                </div>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Calendario y Gráficos -->
            <div class="sidebar">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-calendar"></i>
                            Calendario
                        </h3>
                    </div>
                    <div class="card-content">
                        <div class="calendar" id="calendar">
                            <!-- El calendario se generará aquí -->
                        </div>
                    </div>
                </div>

                <!--
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Progreso Semanal</h3>
                    </div>
                    <div class="card-content">
                        <canvas id="weeklyChart" width="300" height="200"></canvas>
                    </div>
                </div>
                -->                            

            </div>
        </div>
    </div>

    <!-- Loading Spinner -->
    <div id="loadingSpinner" class="loading-spinner">
        <div class="spinner"></div>
    </div>

    <script src="assets/js/dashboard.js"></script>
    <script src="assets/js/common.js"></script>
    <script src="assets/js/auth.js"></script>
</body>
</html>