<?php
session_start();
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;

$client = new DynamoDbClient([
    'region'  => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000'
]);

// Verificar sesión
if (!isset($_SESSION['email'])) {
    header('Location: login.html');
    exit();
}

// Obtener hábitos estándar
$result = $client->scan(['TableName' => 'Habitos']);
$habits = $result['Items'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Hábito - Seguimiento de Hábitos</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <div class="container">
        <div class="form-container">
            <div class="card">
                <div class="card-header">
                    <div class="header-with-back">
                        <button class="btn-back" onclick="window.location.href='index.php'">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h1 class="card-title">
                                <i class="fas fa-plus text-blue"></i>
                                Nuevo Hábito
                            </h1>
                            <p class="card-description">Crea un nuevo hábito para comenzar tu seguimiento</p>
                        </div>
                    </div>
                </div>

                <div class="card-content">
                    <form id="habitForm" class="habit-form">
                        <!-- Selección de hábito -->
                        <div class="form-group">
                            <label for="habitSelect" class="form-label">Selecciona un Hábito *</label>
                            <select id="habitSelect" name="habitSelect" class="form-select" required>
                                <option value="">-- Selecciona --</option>
                                <?php foreach ($habits as $habit): ?>
                                    <option value="<?= $habit['habitId']['S'] ?>"
                                        data-type="<?= $habit['type']['S'] ?>"
                                        <?= isset($habit['defaultTarget']) ? 'data-target="'.$habit['defaultTarget']['N'].'"' : '' ?>
                                        <?= isset($habit['defaultUnit']) ? 'data-unit="'.$habit['defaultUnit']['S'].'"' : '' ?>>
                                        <?= $habit['name']['S'] ?>
                                    </option>
                                <?php endforeach; ?>
                                <option value="custom">-- Personalizado --</option>
                            </select>
                        </div>

                        <!-- Información Básica -->
                        <div class="form-section">
                            <h3 class="section-title">
                                <i class="fas fa-target text-green"></i>
                                Información Básica
                            </h3>

                            <div class="form-group">
                                <label for="habitName" class="form-label">Nombre del Hábito *</label>
                                <input 
                                    type="text" 
                                    id="habitName" 
                                    name="habitName" 
                                    class="form-input" 
                                    placeholder="Ej: Beber agua, Hacer ejercicio, Leer..."
                                    required
                                    disabled
                                >
                            </div>

                            <div class="form-group">
                                <label for="habitDescription" class="form-label">Descripción (opcional)</label>
                                <textarea 
                                    id="habitDescription" 
                                    name="habitDescription" 
                                    class="form-textarea" 
                                    placeholder="Describe tu hábito y por qué es importante para ti..."
                                    rows="3"
                                ></textarea>
                            </div>

                            <div class="form-group">
                                <label for="habitType" class="form-label">Tipo de Hábito *</label>
                                <select id="habitType" name="habitType" class="form-select" required disabled>
                                    <option value="">Selecciona el tipo</option>
                                    <option value="boolean">🔵 Sí/No (Booleano)</option>
                                    <option value="numeric">🟢 Numérico (Con meta)</option>
                                </select>
                                <p class="form-help" id="typeHelp">
                                    Selecciona un tipo para ver más información
                                </p>
                            </div>
                        </div>

                        <!-- Configuración Numérica -->
                        <div id="numericConfig" class="form-section numeric-config" style="display: none;">
                            <h4 class="section-subtitle">Configuración Numérica</h4>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="habitTarget" class="form-label">Meta Diaria *</label>
                                    <input 
                                        type="number" 
                                        id="habitTarget" 
                                        name="habitTarget" 
                                        class="form-input" 
                                        placeholder="Ej: 8, 30, 10000"
                                        min="1"
                                    >
                                </div>

                                <div class="form-group">
                                    <label for="habitUnit" class="form-label">Unidad *</label>
                                    <input 
                                        type="text" 
                                        id="habitUnit" 
                                        name="habitUnit" 
                                        class="form-input" 
                                        placeholder="Ej: vasos, minutos, pasos"
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- Recordatorios -->
                        <div class="form-section reminder-config">
                            <div class="form-group-inline">
                                <div>
                                    <h4 class="section-subtitle">Recordatorios</h4>
                                    <p class="form-help">Recibe notificaciones para mantener tu hábito</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="habitReminder" name="habitReminder">
                                    <span class="slider"></span>
                                </label>
                            </div>

                            <div id="reminderTime" class="form-group" style="display: none;">
                                <label for="reminderTimeInput" class="form-label">Hora del Recordatorio</label>
                                <input 
                                    type="time" 
                                    id="reminderTimeInput" 
                                    name="reminderTimeInput" 
                                    class="form-input"
                                >
                            </div>
                        </div>

                        <!-- Botones -->
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-full">
                                <i class="fas fa-plus"></i>
                                Crear Hábito
                            </button>
                            <button type="button" class="btn btn-secondary btn-full" onclick="window.location.href='index.php'">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Spinner -->
    <div id="loadingSpinner" class="loading-spinner">
        <div class="spinner"></div>
    </div>

    <script src="assets/js/common.js"></script>
    <script src="assets/js/auth.js"></script>
    <script src="assets/js/add-habit.js"></script>
</body>
</html>