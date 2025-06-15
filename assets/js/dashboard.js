document.addEventListener('DOMContentLoaded', () => {
    // Inicializar la aplicación
    initDashboard();
});

// Variables globales para el seguimiento
let currentHabits = [];
let totalHabits = 0;
let completedToday = 0;
let weeklyProgress = 0;
let bestStreak = 0;

async function initDashboard() {
    try {
        // Mostrar spinner de carga
        document.getElementById('loadingSpinner').style.display = 'flex';
        
        // Cargar hábitos y progreso
        await loadHabits();
        
        // Renderizar calendario
        renderCalendar();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Actualizar fecha actual
        updateCurrentDate();
        
    } catch (error) {
        console.error('Error inicializando dashboard:', error);
        showNotification('Error al cargar los datos', 'error');
    } finally {
        // Ocultar spinner
        document.getElementById('loadingSpinner').style.display = 'none';
    }
}

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    document.getElementById('currentDate').textContent = today.toLocaleDateString('es-ES', options);
}

async function loadHabits() {
    try {
        // Cargar hábitos desde el servidor
        const response = await fetch('get_dynamo_habits.php');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error al obtener hábitos');
        }
        
        // Procesar los datos de DynamoDB
        currentHabits = processDynamoData(data.habits);
        totalHabits = currentHabits.length;
        
        // Calcular hábitos completados hoy
        completedToday = currentHabits.filter(habit => habit.completed).length;
        
        // Calcular mejor racha
        bestStreak = calculateBestStreak(currentHabits);
        
        // Calcular progreso semanal (máximo 100%)
        weeklyProgress = Math.min(
            calculateWeeklyProgress(currentHabits), 
            100
        );
        
        renderHabits(currentHabits);
        updateStats();
        
    } catch (error) {
        console.error('Error cargando hábitos:', error);
        showNotification('Error al cargar los hábitos', 'error');
    }
}

function processDynamoData(dynamoData) {
    if (!dynamoData || !Array.isArray(dynamoData)) return [];
    
    return dynamoData.map(item => {
        // Extraer datos de la tabla UsuarioHabitos
        const userHabit = item.userHabit || {};
        const habitDetails = item.habitDetails || {};
        const dailyProgress = item.dailyProgress || {};
        
        return {
            id: userHabit.habitId?.S || '',
            nombre: habitDetails.name?.S || 'Nuevo Hábito',
            tipo: habitDetails.type?.S || 'boolean',
            meta: parseInt(userHabit.customTarget?.N || habitDetails.defaultTarget?.N || '1'),
            unidad: userHabit.customUnit?.S || habitDetails.defaultUnit?.S || '',
            streak: parseInt(userHabit.streak?.N || '0'),
            todayProgress: parseInt(dailyProgress.progress?.N || '0'),
            completed: dailyProgress.completed?.BOOL || false
        };
    });
}

function calculateBestStreak(habits) {
    if (!habits || habits.length === 0) return 0;
    return Math.max(...habits.map(habit => habit.streak || 0));
}

function calculateWeeklyProgress(habits) {
    if (totalHabits === 0) return 0;
    
    // Porcentaje basado en hábitos completados hoy
    const todayPercentage = (completedToday / totalHabits) * 100;
    
    // En una implementación real, aquí sumarías el progreso de toda la semana
    return todayPercentage;
}

function renderHabits(habits) {
    const container = document.getElementById('habitsContainer');
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    if (habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-plus-circle" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">No tienes hábitos aún</h3>
                <p style="color: var(--gray-500); margin-bottom: 1rem;">Crea tu primer hábito para comenzar</p>
                <a href="add-habit.php" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Crear Hábito
                </a>
            </div>
        `;
        return;
    }
    
    // Renderizar cada hábito
    habits.forEach(habit => {
        const habitEl = document.createElement('div');
        habitEl.className = 'habit-item';
        habitEl.dataset.habitId = habit.id;
        habitEl.dataset.habitType = habit.tipo;
        
        // Determinar si está completado
        const isCompleted = habit.completed || (habit.tipo === 'numeric' ? habit.todayProgress >= habit.meta : false);
        
        habitEl.innerHTML = `
            <div class="habit-info">
                <i class="fas fa-${isCompleted ? 'check-circle' : 'circle'} habit-icon ${isCompleted ? '' : 'incomplete'}"></i>
                <div class="habit-details">
                    <h3>${habit.nombre}</h3>
                    <div class="habit-meta">
                        <span class="habit-badge">
                            🔥 ${habit.streak || 0} días
                        </span>
                        ${habit.tipo === 'numeric' ? `
                            <span class="habit-progress-text">
                                ${habit.todayProgress || 0}/${habit.meta} ${habit.unidad || ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            ${habit.tipo === 'numeric' ? `
                <div class="numeric-controls">
                    <button class="btn-numeric decrement" data-habit-id="${habit.id}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="btn-numeric increment" data-habit-id="${habit.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="habit-progress">
                    <div class="progress-bar" style="width: 80px;">
                        <div class="progress-fill" style="width: ${Math.min(((habit.todayProgress || 0) / habit.meta) * 100, 100)}%"></div>
                    </div>
                </div>
            ` : ''}
        `;
        
        container.appendChild(habitEl);
    });
}

function setupEventListeners() {
    // Delegación de eventos para los hábitos
    document.getElementById('habitsContainer').addEventListener('click', (e) => {
        const habitItem = e.target.closest('.habit-item');
        if (!habitItem) return;
        
        const habitId = habitItem.dataset.habitId;
        const habitType = habitItem.dataset.habitType;
        const habit = currentHabits.find(h => h.id === habitId);
        
        if (!habit) return;
        
        // Si es un hábito booleano (click en el icono)
        if ((e.target.classList.contains('habit-icon') || e.target.closest('.habit-icon')) && habitType === 'boolean') {
            toggleBooleanHabit(habit, habitItem);
        }
        
        // Si es un botón de incremento
        if (e.target.classList.contains('increment') || e.target.closest('.increment')) {
            updateNumericHabit(habit, habitItem, 1);
        }
        
        // Si es un botón de decremento
        if (e.target.classList.contains('decrement') || e.target.closest('.decrement')) {
            updateNumericHabit(habit, habitItem, -1);
        }
    });
}

async function toggleBooleanHabit(habit, habitItem) {
    const wasCompleted = habit.completed;
    habit.completed = !wasCompleted;
    
    // Actualizar contadores
    if (habit.completed) {
        completedToday = Math.min(completedToday + 1, totalHabits);
        weeklyProgress = Math.min(weeklyProgress + (100 / totalHabits), 100);
    } else {
        completedToday = Math.max(completedToday - 1, 0);
        weeklyProgress = Math.max(weeklyProgress - (100 / totalHabits), 0);
    }
    
    // Actualizar UI
    updateHabitUI(habit, habitItem);
    updateStats();
    
    // Actualizar en el servidor
    await updateHabitOnServer(habit.id, habit.completed);
    
    showNotification(habit.completed ? '¡Hábito completado!' : 'Hábito marcado como no completado');
}

async function updateNumericHabit(habit, habitItem, change) {
    const newProgress = (habit.todayProgress || 0) + change;
    const wasCompleted = habit.completed;
    
    // Asegurar que el progreso no sea negativo ni exceda la meta
    habit.todayProgress = Math.max(0, Math.min(newProgress, habit.meta));
    habit.completed = habit.todayProgress >= habit.meta;
    
    // Actualizar contadores solo si cambia el estado de completado
    if (!wasCompleted && habit.completed) {
        completedToday = Math.min(completedToday + 1, totalHabits);
        weeklyProgress = Math.min(weeklyProgress + (100 / totalHabits), 100);
    } else if (wasCompleted && !habit.completed) {
        completedToday = Math.max(completedToday - 1, 0);
        weeklyProgress = Math.max(weeklyProgress - (100 / totalHabits), 0);
    }
    
    // Actualizar UI
    updateHabitUI(habit, habitItem);
    updateStats();
    
    // Actualizar en el servidor
    await updateNumericHabitOnServer(habit.id, habit.todayProgress, habit.completed);
    
    showNotification('Progreso actualizado');
}

function updateHabitUI(habit, habitItem) {
    const isCompleted = habit.completed || (habit.tipo === 'numeric' ? (habit.todayProgress || 0) >= habit.meta : false);
    
    // Actualizar icono
    const icon = habitItem.querySelector('.habit-icon');
    if (icon) {
        icon.className = `fas fa-${isCompleted ? 'check-circle' : 'circle'} habit-icon ${isCompleted ? '' : 'incomplete'}`;
    }
    
    // Actualizar texto de progreso para hábitos numéricos
    if (habit.tipo === 'numeric') {
        const progressText = habitItem.querySelector('.habit-progress-text');
        if (progressText) {
            progressText.textContent = `${habit.todayProgress || 0}/${habit.meta} ${habit.unidad || ''}`;
        }
        
        // Actualizar barra de progreso
        const progressFill = habitItem.querySelector('.progress-fill');
        if (progressFill) {
            const progressPercent = Math.min(((habit.todayProgress || 0) / habit.meta) * 100, 100);
            progressFill.style.width = `${progressPercent}%`;
        }
    }
}

function updateStats() {
    // Asegurar que los completados hoy no excedan el total de hábitos
    completedToday = Math.min(completedToday, totalHabits);
    
    // Calcular porcentaje de completados hoy
    const todayPercentage = totalHabits > 0 ? 
        Math.round((completedToday / totalHabits) * 100) : 0;
    
    // Actualizar UI
    document.getElementById('totalHabits').textContent = totalHabits;
    document.getElementById('completedToday').textContent = `${completedToday}/${totalHabits}`;
    document.getElementById('bestStreak').textContent = `${bestStreak} días`;
    
    // Asegurar que el progreso semanal no exceda 100%
    const weeklyProgressDisplay = Math.min(Math.round(weeklyProgress), 100);
    document.getElementById('weeklyProgress').textContent = `${weeklyProgressDisplay}%`;
    
    // Actualizar barra de progreso
    const progressBar = document.getElementById('completionProgress');
    if (progressBar) {
        progressBar.style.width = `${todayPercentage}%`;
    }
    
    // Renderizar gráfico semanal
    renderWeeklyChart();
}

function renderWeeklyChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    
    // Datos de ejemplo para la gráfica semanal (limitado a 100%)
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const progressData = [30, 45, 60, 75, 90, 100, 100].map(val => Math.min(val, 100));
    
    if (window.weeklyChart) {
        window.weeklyChart.destroy();
    }
    
    window.weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekDays,
            datasets: [{
                label: 'Progreso (%)',
                data: progressData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + '% completado';
                        }
                    }
                }
            }
        }
    });
}

function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    let calendarHTML = `
        <div class="calendar-header">
            <div class="calendar-day-header">D</div>
            <div class="calendar-day-header">L</div>
            <div class="calendar-day-header">M</div>
            <div class="calendar-day-header">X</div>
            <div class="calendar-day-header">J</div>
            <div class="calendar-day-header">V</div>
            <div class="calendar-day-header">S</div>
        </div>
        <div class="calendar-grid">
    `;

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarHTML += '<div class="calendar-day inactive"></div>';
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && currentMonth === today.getMonth();
        const hasProgress = Math.random() > 0.3; // Simulación de progreso

        calendarHTML += `
            <div class="calendar-day ${isToday ? "today" : ""} ${hasProgress ? "completed" : ""}">
                ${day}
            </div>
        `;
    }

    calendarHTML += "</div>";
    calendarEl.innerHTML = calendarHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function updateHabitOnServer(habitId, completed) {
    try {
        const response = await fetch('update_habit.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                habitId,
                completed,
                date: new Date().toISOString().split('T')[0]
            })
        });
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Error al actualizar el hábito');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al guardar el estado del hábito', 'error');
    }
}

async function updateNumericHabitOnServer(habitId, progress, completed) {
    try {
        const response = await fetch('update_numeric_habit.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                habitId,
                progress,
                completed,
                date: new Date().toISOString().split('T')[0]
            })
        });
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Error al actualizar el hábito numérico');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al guardar el progreso del hábito', 'error');
    }
}