// Declare Utils variable before using it
const Utils = {
  showLoading: () => console.log("Loading..."),
  hideLoading: () => console.log("Loading hidden"),
  makeRequest: async (url, options = {}) => {
    const response = await fetch(url, options)
    return response.json()
  },
  getCurrentDate: () => new Date().toISOString().split("T")[0],
  debounce: (func, wait) => {
    let timeout
    return function (...args) {
      
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  },
  showNotification: (message, type = "success") => console.log(`Notification (${type}): ${message}`),
  updateProgressBar: (id, percentage) => {
    const progressBar = document.getElementById(id)
    if (progressBar) {
      progressBar.style.width = `${percentage}%`
    }
  },
}

class DailyLog {
  constructor() {
    this.habits = []
    this.dailyNotes = ""
    this.init()
  }

  async init() {
    try {
      Utils.showLoading()
      await this.loadHabits()
      this.renderHabits()
      this.updateSummary()
      await this.loadDailyNotes()
    } catch (error) {
      console.error("Error inicializando registro diario:", error)
      Utils.showNotification("Error cargando los datos", "error")
    } finally {
      Utils.hideLoading()
    }
  }

  async loadHabits() {
    try {
      const response = await Utils.makeRequest("daily-habits.php")
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
          currentValue: 5,
          completed: false,
          streak: 12,
        },
        {
          id: "2",
          name: "Ejercicio",
          type: "boolean",
          completed: true,
          streak: 7,
        },
        {
          id: "3",
          name: "Leer",
          type: "numeric",
          target: 30,
          unit: "minutos",
          currentValue: 25,
          completed: false,
          streak: 5,
        },
        {
          id: "4",
          name: "Meditar",
          type: "boolean",
          completed: false,
          streak: 3,
        },
        {
          id: "5",
          name: "Caminar",
          type: "numeric",
          target: 10000,
          unit: "pasos",
          currentValue: 7500,
          completed: false,
          streak: 8,
        },
      ]
    }
  }

  async loadDailyNotes() {
    try {
      const response = await Utils.makeRequest(`daily-notes.php?date=${Utils.getCurrentDate()}`)
      this.dailyNotes = response.notes || ""

      const notesElement = document.getElementById("dailyNotes")
      if (notesElement) {
        notesElement.value = this.dailyNotes
        notesElement.addEventListener("input", (e) => {
          this.dailyNotes = e.target.value
        })
      }
    } catch (error) {
      console.error("Error cargando notas diarias:", error)
    }
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

    container.innerHTML = this.habits.map((habit) => this.renderHabitItem(habit)).join("")
    this.setupHabitEventListeners()
  }

  renderHabitItem(habit) {
    return `
            <div class="habit-daily-item">
                <div class="habit-daily-header">
                    <div class="habit-daily-info">
                        <i class="fas fa-${habit.completed ? "check-circle" : "circle"} habit-icon ${habit.completed ? "" : "incomplete"}"></i>
                        <div class="habit-daily-details">
                            <h3>${habit.name}</h3>
                            <div class="habit-badge">
                                <i class="fas fa-award"></i>
                                ${habit.streak} días
                            </div>
                        </div>
                    </div>
                </div>

                <div class="habit-daily-controls">
                    ${habit.type === "boolean" ? this.renderBooleanControl(habit) : this.renderNumericControl(habit)}
                </div>
            </div>
        `
  }

  renderBooleanControl(habit) {
    return `
            <div class="form-group-inline">
                <label for="habit-${habit.id}" class="form-label">¿Completaste este hábito hoy?</label>
                <label class="switch">
                    <input type="checkbox" id="habit-${habit.id}" data-habit-id="${habit.id}" ${habit.completed ? "checked" : ""}>
                    <span class="slider"></span>
                </label>
            </div>
        `
  }

  renderNumericControl(habit) {
    const percentage = habit.target > 0 ? (habit.currentValue / habit.target) * 100 : 0

    return `
            <div class="numeric-controls">
                <div class="numeric-input-group">
                    <label for="habit-${habit.id}" class="form-label">Progreso actual</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                        <input 
                            type="number" 
                            id="habit-${habit.id}" 
                            class="numeric-input" 
                            data-habit-id="${habit.id}"
                            value="${habit.currentValue}" 
                            min="0" 
                            max="${habit.target * 2}"
                        >
                        <span class="progress-unit">/ ${habit.target} ${habit.unit}</span>
                    </div>
                </div>
                
                <div class="progress-info">
                    <div class="progress-label">
                        <span>Progreso</span>
                        <span>${Math.round(percentage)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-${habit.id}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="completion-status ${habit.completed ? "completed" : ""}">
                ${
                  habit.completed
                    ? '<i class="fas fa-check-circle"></i> ¡Meta alcanzada!'
                    : `<i class="fas fa-clock"></i> Faltan ${habit.target - habit.currentValue} ${habit.unit}`
                }
            </div>
        `
  }

  setupHabitEventListeners() {
    // Event listeners para hábitos booleanos
    document.querySelectorAll('input[type="checkbox"][data-habit-id]').forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const habitId = e.target.dataset.habitId
        this.updateHabitValue(habitId, e.target.checked)
      })
    })

    // Event listeners para hábitos numéricos
    document.querySelectorAll('input[type="number"][data-habit-id]').forEach((input) => {
      input.addEventListener(
        "input",
        Utils.debounce((e) => {
          const habitId = e.target.dataset.habitId
          const value = Number.parseInt(e.target.value) || 0
          this.updateHabitValue(habitId, value)
        }, 300),
      )
    })
  }

  updateHabitValue(habitId, value) {
    const habitIndex = this.habits.findIndex((h) => h.id === habitId)
    if (habitIndex === -1) return

    const habit = this.habits[habitIndex]

    if (habit.type === "boolean") {
      habit.completed = value
    } else {
      habit.currentValue = value
      habit.completed = value >= habit.target

      // Actualizar barra de progreso
      const percentage = (value / habit.target) * 100
      const progressBar = document.getElementById(`progress-${habitId}`)
      if (progressBar) {
        progressBar.style.width = `${percentage}%`
      }

      // Actualizar estado de completado
      const statusElement = document
        .querySelector(`[data-habit-id="${habitId}"]`)
        .closest(".habit-daily-item")
        .querySelector(".completion-status")
      if (statusElement) {
        statusElement.className = `completion-status ${habit.completed ? "completed" : ""}`
        statusElement.innerHTML = habit.completed
          ? '<i class="fas fa-check-circle"></i> ¡Meta alcanzada!'
          : `<i class="fas fa-clock"></i> Faltan ${habit.target - value} ${habit.unit}`
      }
    }

    this.updateSummary()
    this.checkMotivationalMessage()
  }

  updateSummary() {
    const totalHabits = this.habits.length
    const completedHabits = this.habits.filter((h) => h.completed).length
    const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0

    // Actualizar textos
    document.getElementById("progressDescription").textContent =
      `${completedHabits} de ${totalHabits} hábitos completados`
    document.getElementById("completionPercentage").textContent = `${completionRate}%`

    // Actualizar badge
    const badgeElement = document.getElementById("completionBadge")
    let badgeText = "Puedes mejorar"
    let badgeClass = ""

    if (completionRate >= 80) {
      badgeText = "¡Excelente!"
      badgeClass = "excellent"
    } else if (completionRate >= 50) {
      badgeText = "Bien"
      badgeClass = "good"
    }

    badgeElement.textContent = badgeText
    badgeElement.className = `summary-badge ${badgeClass}`

    // Actualizar barra de progreso
    Utils.updateProgressBar("dailyProgress", completionRate)
  }

  checkMotivationalMessage() {
    const completedHabits = this.habits.filter((h) => h.completed).length
    const totalHabits = this.habits.length
    const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0

    const messageElement = document.getElementById("motivationalMessage")
    const textElement = document.getElementById("motivationalText")

    if (completionRate >= 80) {
      textElement.textContent = `Has completado ${completedHabits} de ${totalHabits} hábitos. ¡Sigue así!`
      messageElement.style.display = "block"
    } else {
      messageElement.style.display = "none"
    }
  }

  async saveDailyLog() {
    try {
      Utils.showLoading()

      const logData = {
        date: Utils.getCurrentDate(),
        habits: this.habits.map((habit) => ({
          id: habit.id,
          value: habit.type === "boolean" ? (habit.completed ? 1 : 0) : habit.currentValue,
          completed: habit.completed,
          target: habit.target || 1,
        })),
        notes: this.dailyNotes,
      }

      const response = await Utils.makeRequest("save-daily-log.php", {
        method: "POST",
        body: JSON.stringify(logData),
      })

      if (response.success) {
        Utils.showNotification("¡Registro diario guardado exitosamente!")
      } else {
        throw new Error(response.message || "Error guardando el registro")
      }
    } catch (error) {
      console.error("Error guardando registro diario:", error)
      Utils.showNotification(error.message || "Error guardando el registro", "error")
    } finally {
      Utils.hideLoading()
    }
  }
}

// Función global para guardar
window.saveDailyLog = () => {
  if (window.dailyLog) {
    window.dailyLog.saveDailyLog()
  }
}

// Inicializar registro diario
document.addEventListener("DOMContentLoaded", () => {
  window.dailyLog = new DailyLog()
})
