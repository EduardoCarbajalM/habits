<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Hábito - Seguimiento de Hábitos</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="assets/js/common.js"></script>
    <script src="assets/js/auth.js"></script>
</head>
<body>
    <div class="container">
        <div class="form-container">
            <div class="card">
                <header class="header">
                    <div class="header-content protected-header">
                        <div class="header-with-back">
                            <button class="btn-back" onclick="window.location.href='index.html'">
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
                        <!-- El menú de usuario se insertará aquí dinámicamente -->
                    </div>
                </header>

                <div class="card-content">
                    <form id="habitForm" class="habit-form">
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
                                <select id="habitType" name="habitType" class="form-select" required>
                                    <option value="">Selecciona el tipo</option>
                                    <option value="boolean">
                                        🔵 Sí/No (Booleano)
                                    </option>
                                    <option value="numeric">
                                        🟢 Numérico (Con meta)
                                    </option>
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
                            <button type="button" class="btn btn-secondary btn-full" onclick="window.location.href='index.html'">
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

    <script src="assets/js/add-habit.js"></script>
</body>
</html>
