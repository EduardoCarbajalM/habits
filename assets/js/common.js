// Configuración global
const API_BASE_URL = "api/"

// Utilidades comunes
class Utils {
  static formatDate(date) {
    return new Date(date).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  static formatDateShort(date) {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })
  }

  static getCurrentDate() {
    return new Date().toISOString().split("T")[0]
  }

  static showLoading() {
    document.getElementById("loadingSpinner").style.display = "flex"
  }

  static hideLoading() {
    document.getElementById("loadingSpinner").style.display = "none"
  }

  static showNotification(message, type = "success") {
    // Crear elemento de notificación
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"}"></i>
                <span>${message}</span>
            </div>
        `

    // Agregar estilos si no existen
    if (!document.getElementById("notification-styles")) {
      const styles = document.createElement("style")
      styles.id = "notification-styles"
      styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 0.5rem;
                    color: white;
                    font-weight: 500;
                    z-index: 1001;
                    animation: slideIn 0.3s ease;
                }
                .notification-success { background: #10b981; }
                .notification-error { background: #ef4444; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `
      document.head.appendChild(styles)
    }

    document.body.appendChild(notification)

    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.animation = "slideIn 0.3s ease reverse"
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  static async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(API_BASE_URL + endpoint, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error en la solicitud")
      }

      return data
    } catch (error) {
      console.error("Error en la solicitud:", error)
      throw error
    }
  }

  static debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  static calculateStreak(records) {
    if (!records || records.length === 0) return 0

    // Ordenar registros por fecha (más reciente primero)
    const sortedRecords = records
      .filter((record) => record.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    if (sortedRecords.length === 0) return 0

    let streak = 0
    const today = new Date()
    const currentDate = new Date(today)

    // Verificar si hay registro para hoy o ayer
    const latestRecord = new Date(sortedRecords[0].date)
    const daysDiff = Math.floor((today - latestRecord) / (1000 * 60 * 60 * 24))

    if (daysDiff > 1) return 0 // Si el último registro es de hace más de 1 día

    // Contar días consecutivos
    for (let i = 0; i < sortedRecords.length; i++) {
      const recordDate = new Date(sortedRecords[i].date)
      const expectedDate = new Date(currentDate)
      expectedDate.setDate(expectedDate.getDate() - i)

      if (recordDate.toDateString() === expectedDate.toDateString()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  static updateProgressBar(elementId, percentage) {
    const element = document.getElementById(elementId)
    if (element) {
      element.style.width = `${Math.min(100, Math.max(0, percentage))}%`
    }
  }

  static createChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const { width, height } = canvas

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)

    // Configuración por defecto
    const config = {
      type: "line",
      padding: 40,
      gridColor: "#e5e7eb",
      lineColor: "#3b82f6",
      pointColor: "#3b82f6",
      textColor: "#6b7280",
      ...options,
    }

    if (config.type === "line") {
      this.drawLineChart(ctx, data, config, width, height)
    } else if (config.type === "bar") {
      this.drawBarChart(ctx, data, config, width, height)
    }
  }

  static drawLineChart(ctx, data, config, width, height) {
    const { padding } = config
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    if (!data || data.length === 0) return

    // Encontrar valores min y max
    const values = data.map((d) => d.value)
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue || 1

    // Dibujar grid
    ctx.strokeStyle = config.gridColor
    ctx.lineWidth = 1

    // Líneas horizontales
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Líneas verticales
    const stepX = chartWidth / (data.length - 1)
    for (let i = 0; i < data.length; i++) {
      const x = padding + stepX * i
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Dibujar línea de datos
    ctx.strokeStyle = config.lineColor
    ctx.lineWidth = 3
    ctx.beginPath()

    data.forEach((point, index) => {
      const x = padding + stepX * index
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Dibujar puntos
    ctx.fillStyle = config.pointColor
    data.forEach((point, index) => {
      const x = padding + stepX * index
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Etiquetas
    ctx.fillStyle = config.textColor
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"

    data.forEach((point, index) => {
      const x = padding + stepX * index
      const label = point.label || point.date
      ctx.fillText(label, x, height - padding + 20)
    })
  }

  static drawBarChart(ctx, data, config, width, height) {
    const { padding } = config
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    if (!data || data.length === 0) return

    const maxValue = Math.max(...data.map((d) => d.value))
    const barWidth = (chartWidth / data.length) * 0.8
    const barSpacing = (chartWidth / data.length) * 0.2

    // Dibujar barras
    ctx.fillStyle = config.lineColor

    data.forEach((point, index) => {
      const barHeight = (point.value / maxValue) * chartHeight
      const x = padding + (chartWidth / data.length) * index + barSpacing / 2
      const y = padding + chartHeight - barHeight

      ctx.fillRect(x, y, barWidth, barHeight)
    })

    // Etiquetas
    ctx.fillStyle = config.textColor
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"

    data.forEach((point, index) => {
      const x = padding + (chartWidth / data.length) * index + chartWidth / data.length / 2
      const label = point.label || point.date
      ctx.fillText(label, x, height - padding + 20)
    })
  }
}

// Inicialización común
document.addEventListener("DOMContentLoaded", () => {
  // Ocultar spinner de carga inicial
  Utils.hideLoading()

  // Configurar fecha actual en elementos que la necesiten
  const currentDateElements = document.querySelectorAll("#currentDate, .current-date")
  currentDateElements.forEach((element) => {
    element.textContent = Utils.formatDate(new Date())
  })

  // Configurar fecha de hoy en elementos específicos
  const todayDateElements = document.querySelectorAll("#todayDate")
  todayDateElements.forEach((element) => {
    element.textContent = Utils.formatDate(new Date())
  })
})

// Exportar para uso global
window.Utils = Utils
