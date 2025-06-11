// Import or declare the Utils variable before using it
const Utils = {
  showNotification: (message, type) => {
    console.log(`Notification (${type}): ${message}`)
  },
  showLoading: () => {
    console.log("Loading...")
  },
  hideLoading: () => {
    console.log("Loading hidden.")
  },
  makeRequest: async (url, options = {}) => {
    const response = await fetch(url, options)
    return response.json()
  },
  getCurrentDate: () => new Date().toISOString().split("T")[0],
  formatDate: (date) => date.toLocaleDateString(),
  formatDateShort: (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  updateProgressBar: (id, percentage) => {
    const progressBar = document.getElementById(id)
    if (progressBar) {
      progressBar.style.width = `${percentage}%`
    }
  },
  createChart: (id, data, options) => {
    console.log(`Chart created with id: ${id}, data: ${JSON.stringify(data)}, options: ${JSON.stringify(options)}`)
  },
}

class HabitDetail {
  constructor() {
    this.habitId = this.getHabitIdFromUrl()
    this.habit = null
    this.records = []
    this.todayProgress = 0
    this.todayNotes = ""

    this.init()
  }

  getHabitIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("id")
  }

  async init() {
    if (!this.habitId) {
      Utils.showNotification("ID de hábito no válido", "error")
      window.location.href = "index.html"
      return
    }

    try {
      Utils.showLoading()
      await this.loadHabit()
      await this.loadRecords()
      this.renderHabitInfo()
      this.renderStats()
      this.renderTodayProgress()
      this.renderChart()
      this.renderRecords()
    } catch (error) {
      console.error("Error cargando detalle del hábito:", error)
      Utils.showNotification("Error cargando los datos", "error")
    } finally {
      Utils.hideLoading()
    }
  }

  async loadHabit() {
    try {
      const response = await Utils.makeRequest(`habit.php?id=${this.habitId}`)
      this.habit = response.habit
    } catch (error) {
      console.error("Error cargando hábito:", error)
      // Datos de ejemplo para desarrollo
      this.habit = {
        id: this.habitId,
        name: "Beber Agua",
        description: "Mantenerme hidratado bebiendo suficiente agua durante el día",
        type: "numeric",
        target: 8,
        unit: "vasos",
        streak: 12,
        bestStreak: 25,
        totalDays: 45,
      }
    }
  }

  async loadRecords() {
    try {
      const response = await Utils.makeRequest(`records.php?habitId=${this.habitId}`)
      this.records = response.records || []
    } catch (error) {
      console.error("Error cargando registros:", error)
      // Datos de ejemplo para desarrollo
      this.records = [
        { date: "2024-01-07", value: 5, target: 8, completed: false, notes: "Día ocupado, olvidé beber suficiente" },
        { date: "2024-01-06", value: 8, target: 8, completed: true, notes: "¡Perfecto! Me sentí muy bien" },
        { date: "2024-01-05", value: 8, target: 8, completed: true, notes: "" },
        { date: "2024-01-04", value: 7, target: 8, completed: false, notes: "Casi lo logro" },
        { date: "2024-01-03", value: 8, target: 8, completed: true, notes: "Excelente día" },
      ]
    }

    // Buscar registro de hoy
    const today = Utils.getCurrentDate()
    const todayRecord = this.records.find((r) => r.date === today)
    if (todayRecord) {
      this.todayProgress = todayRecord.value || 0
      this.todayNotes = todayRecord.notes || ""
    }
  }

  renderHabitInfo() {
    document.getElementById("habitName").innerHTML = `
            ${this.habit.name}
            <button class="btn-icon">
                <i class="fas fa-edit"></i>
            </button>
        `

    const descriptionElement = document.getElementById("habitDescription")
    if (descriptionElement) {
      descriptionElement.textContent = this.habit.description || ""
    }
  }

  renderStats() {
    const completionRate = this.calculateCompletionRate()

    document.getElementById("currentStreak").textContent = this.habit.streak
    document.getElementById("bestStreak").textContent = this.habit.bestStreak
    document.getElementById("successRate").textContent = `${completionRate}%`
    document.getElementById("totalDays").textContent = this.habit.totalDays

    Utils.updateProgressBar("successProgress", completionRate)
  }

  calculateCompletionRate() {
    if (this.records.length === 0) return 0
    const completedRecords = this.records.filter((r) => r.completed).length
    return Math.round((completedRecords / this.records.length) * 100)
  }

  renderTodayProgress() {
    const container = document.getElementById("todayProgress")
    if (!container) return

    if (this.habit.type === "boolean") {
      container.innerHTML = `
                <div class="form-group-inline">
                    <label for="todayCompleted" class="form-label">¿Completaste este hábito hoy?</label>
                    <label class="switch">
                        <input type="checkbox" id="todayCompleted" ${this.todayProgress ? "checked" : ""}>
                        <span class="slider"></span>
                    </label>
                </div>
            `

      document.getElementById("todayCompleted").addEventListener("change", (e) => {
        this.todayProgress = e.target.checked ? 1 : 0
      })
    } else {
      const percentage = this.habit.target > 0 ? (this.todayProgress / this.habit.target) * 100 : 0

      container.innerHTML = `
                <div class="form-group">
                    <label for="todayValue" class="form-label">Progreso actual</label>
                    <div class="progress-input-group">
                        <input 
                            type="number" 
                            id="todayValue" 
                            class="progress-input" 
                            value="${this.todayProgress}" 
                            min="0" 
                            max="${this.habit.target * 2}"
                        >
                        <span class="progress-unit">/ ${this.habit.target} ${this.habit.unit}</span>
                    </div>
                    <div class="progress-bar" style="margin-top: 0.75rem;">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="progress-status ${this.todayProgress >= this.habit.target ? "completed" : "incomplete"}">
                        ${
                          this.todayProgress >= this.habit.target
                            ? '<i class="fas fa-check-circle"></i> ¡Meta completada!'
                            : `Faltan ${this.habit.target - this.todayProgress} ${this.habit.unit}`
                        }
                    </div>
                </div>
            `

      document.getElementById("todayValue").addEventListener("input", (e) => {
        this.todayProgress = Number.parseInt(e.target.value) || 0
        this.updateProgressDisplay()
      })
    }

    // Cargar notas existentes
    const notesElement = document.getElementById("todayNotes")
    if (notesElement) {
      notesElement.value = this.todayNotes
      notesElement.addEventListener("input", (e) => {
        this.todayNotes = e.target.value
      })
    }
  }

  updateProgressDisplay() {
    if (this.habit.type === "numeric") {
      const percentage = (this.todayProgress / this.habit.target) * 100
      const progressBar = document.querySelector("#todayProgress .progress-fill")
      const statusElement = document.querySelector("#todayProgress .progress-status")

      if (progressBar) {
        progressBar.style.width = `${percentage}%`
      }

      if (statusElement) {
        const isCompleted = this.todayProgress >= this.habit.target
        statusElement.className = `progress-status ${isCompleted ? "completed" : "incomplete"}`
        statusElement.innerHTML = isCompleted
          ? '<i class="fas fa-check-circle"></i> ¡Meta completada!'
          : `Faltan ${this.habit.target - this.todayProgress} ${this.habit.unit}`
      }
    }
  }

  renderChart() {
    // Preparar datos para el gráfico (últimos 7 días)
    const last7Days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const record = this.records.find((r) => r.date === dateStr)
      const value = record ? record.value : 0

      last7Days.push({
        label: Utils.formatDateShort(date),
        value: value,
        target: this.habit.target || 1,
      })
    }

    Utils.createChart("progressChart", last7Days, {
      type: "line",
      lineColor: "#3b82f6",
    })
  }

  renderRecords() {
    const container = document.getElementById("recordsHistory")
    if (!container) return

    if (this.records.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt" style="font-size: 2rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <p style="color: var(--gray-600);">No hay registros aún</p>
                </div>
            `
      return
    }

    container.innerHTML = this.records
      .map(
        (record) => `
            <div class="record-item">
                <div class="record-info">
                    <i class="fas fa-${record.completed ? "check-circle" : "circle"} habit-icon ${record.completed ? "" : "incomplete"}"></i>
                    <div>
                        <div class="record-date">${Utils.formatDate(new Date(record.date))}</div>
                        <div class="record-details">
                            ${
                              this.habit.type === "numeric"
                                ? `${record.value}/${record.target} ${this.habit.unit}`
                                : record.completed
                                  ? "Completado"
                                  : "No completado"
                            }
                            ${record.notes ? ` • ${record.notes}` : ""}
                        </div>
                    </div>
                </div>
                <div class="record-actions">
                    ${
                      this.habit.type === "numeric"
                        ? `
                        <div class="progress-bar" style="width: 80px;">
                            <div class="progress-fill" style="width: ${(record.value / record.target) * 100}%"></div>
                        </div>
                    `
                        : ""
                    }
                    <button class="btn-icon" onclick="editRecord('${record.date}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  async saveTodayProgress() {
    try {
      Utils.showLoading()

      const progressData = {
        habitId: this.habitId,
        date: Utils.getCurrentDate(),
        value: this.todayProgress,
        completed: this.habit.type === "boolean" ? this.todayProgress > 0 : this.todayProgress >= this.habit.target,
        notes: this.todayNotes,
        target: this.habit.target || 1,
      }

      const response = await Utils.makeRequest("save-progress.php", {
        method: "POST",
        body: JSON.stringify(progressData),
      })

      if (response.success) {
        Utils.showNotification("¡Progreso guardado exitosamente!")
        await this.loadRecords()
        this.renderRecords()
        this.renderStats()
      } else {
        throw new Error(response.message || "Error guardando el progreso")
      }
    } catch (error) {
      console.error("Error guardando progreso:", error)
      Utils.showNotification(error.message || "Error guardando el progreso", "error")
    } finally {
      Utils.hideLoading()
    }
  }
}

// Funciones globales
window.saveTodayProgress = () => {
  if (window.habitDetail) {
    window.habitDetail.saveTodayProgress()
  }
}

window.editRecord = (date) => {
  // Implementar edición de registro
  Utils.showNotification("Función de edición en desarrollo")
}

// Inicializar detalle del hábito
document.addEventListener("DOMContentLoaded", () => {
  window.habitDetail = new HabitDetail()
})
