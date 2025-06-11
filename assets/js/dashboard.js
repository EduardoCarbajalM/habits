class Dashboard {
  constructor() {
    this.habits = []
    this.stats = {
      totalHabits: 0,
      completedToday: 0,
      bestStreak: 0,
      weeklyProgress: 0,
    }
    this.init()
  }

  async init() {
    try {
      window.Utils.showLoading()
      await this.loadHabits()
      await this.loadStats()
      this.renderHabits()
      this.renderStats()
      this.renderCalendar()
      this.renderCharts()
    } catch (error) {
      console.error("Error inicializando dashboard:", error)
      window.Utils.showNotification("Error cargando los datos", "error")
    } finally {
      window.Utils.hideLoading()
    }
  }

  async loadHabits() {
    try {
      const response = await window.Utils.makeRequest("habits.php")
      this.habits = response.habits || []
    } catch (error) {
      console.error("Error cargando hábitos:", error)
      // Datos de ejemplo para desarrollo
      this.habits = [
        {
          id: "1",
          name: "Beber agua",
          type: "numeric",
          target: 8,
          unit: "vasos",
          streak: 12,
          todayProgress: 5,
          completed: false,
        },
        {
          id: "2",
          name: "Ejercicio",
          type: "boolean",
          streak: 7,
          completed: true,
        },
        {
          id: "3",
          name: "Leer",
          type: "numeric",
          target: 30,
          unit: "minutos",
          streak: 5,
          todayProgress: 25,
          completed: false,
        },
        {
          id: "4",
          name: "Meditar",
          type: "boolean",
          streak: 3,
          completed: false,
        },
      ]
    }
  }

  async loadStats() {
    try {
      const response = await window.Utils.makeRequest("stats.php")
      this.stats = response.stats || this.calculateStats()
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
      this.stats = this.calculateStats()
    }
  }

  calculateStats() {
    const totalHabits = this.habits.length
    const completedToday = this.habits.filter((h) => h.completed).length
    const bestStreak = Math.max(...this.habits.map((h) => h.streak), 0)
    const weeklyProgress = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

    return {
      totalHabits,
      completedToday,
      bestStreak,
      weeklyProgress,
    }
  }

  renderStats() {
    const { totalHabits, completedToday, bestStreak, weeklyProgress } = this.stats

    document.getElementById("totalHabits").textContent = totalHabits
    document.getElementById("completedToday").textContent = `${completedToday}/${totalHabits}`
    document.getElementById("bestStreak").textContent = `${bestStreak} días`
    document.getElementById("weeklyProgress").textContent = `${weeklyProgress}%`

    // Actualizar barra de progreso
    window.Utils.updateProgressBar("completionProgress", weeklyProgress)
  }

  renderHabits() {
    const container = document.getElementById("habitsContainer")
    if (!container) return

    if (this.habits.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">No tienes hábitos aún</h3>
                    <p style="color: var(--gray-500); margin-bottom: 1rem;">Crea tu primer hábito para comenzar</p>
                    <button class="btn btn-primary" onclick="window.location.href='add-habit.html'">
                        <i class="fas fa-plus"></i>
                        Crear Hábito
                    </button>
                </div>
            `
      return
    }

    container.innerHTML = this.habits
      .map(
        (habit) => `
            <div class="habit-item" onclick="this.viewHabitDetail('${habit.id}')">
                <div class="habit-info">
                    <i class="fas fa-${habit.completed ? "check-circle" : "circle"} habit-icon ${habit.completed ? "" : "incomplete"}"></i>
                    <div class="habit-details">
                        <h3>${habit.name}</h3>
                        <div class="habit-meta">
                            <span class="habit-badge">
                                🔥 ${habit.streak} días
                            </span>
                            ${
                              habit.type === "numeric"
                                ? `
                                <span class="habit-progress-text">
                                    ${habit.todayProgress || 0}/${habit.target} ${habit.unit}
                                </span>
                            `
                                : ""
                            }
                        </div>
                    </div>
                </div>
                ${
                  habit.type === "numeric"
                    ? `
                    <div class="habit-progress">
                        <div class="progress-bar" style="width: 80px;">
                            <div class="progress-fill" style="width: ${((habit.todayProgress || 0) / habit.target) * 100}%"></div>
                        </div>
                    </div>
                `
                    : ""
                }
            </div>
        `,
      )
      .join("")
  }

  viewHabitDetail(habitId) {
    window.location.href = `habit-detail.html?id=${habitId}`
  }

  renderCalendar() {
    const container = document.getElementById("calendar")
    if (!container) return

    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

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
        `

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarHTML += '<div class="calendar-day inactive"></div>'
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate()
      const hasProgress = Math.random() > 0.3 // Simulación de progreso

      calendarHTML += `
                <div class="calendar-day ${isToday ? "today" : ""} ${hasProgress && !isToday ? "completed" : ""}">
                    ${day}
                </div>
            `
    }

    calendarHTML += "</div>"
    container.innerHTML = calendarHTML
  }

  renderCharts() {
    // Datos de ejemplo para el gráfico semanal
    const weeklyData = [
      { label: "Lun", value: 3 },
      { label: "Mar", value: 4 },
      { label: "Mié", value: 2 },
      { label: "Jue", value: 4 },
      { label: "Vie", value: 3 },
      { label: "Sáb", value: 4 },
      { label: "Dom", value: 3 },
    ]

    window.Utils.createChart("weeklyChart", weeklyData, {
      type: "bar",
      lineColor: "#3b82f6",
    })
  }

  async updateHabitProgress(habitId, progress) {
    try {
      window.Utils.showLoading()

      const response = await window.Utils.makeRequest("update-progress.php", {
        method: "POST",
        body: JSON.stringify({
          habitId,
          progress,
          date: window.Utils.getCurrentDate(),
        }),
      })

      if (response.success) {
        window.Utils.showNotification("Progreso actualizado correctamente")
        await this.loadHabits()
        this.renderHabits()
        this.renderStats()
      }
    } catch (error) {
      console.error("Error actualizando progreso:", error)
      window.Utils.showNotification("Error actualizando el progreso", "error")
    } finally {
      window.Utils.hideLoading()
    }
  }
}

// Inicializar dashboard
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new Dashboard()
})
