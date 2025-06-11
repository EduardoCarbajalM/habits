class AddHabitForm {
  constructor() {
    this.form = document.getElementById("habitForm")
    this.habitType = document.getElementById("habitType")
    this.numericConfig = document.getElementById("numericConfig")
    this.reminderCheckbox = document.getElementById("habitReminder")
    this.reminderTime = document.getElementById("reminderTime")

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.updateTypeHelp()
  }

  setupEventListeners() {
    // Cambio de tipo de hábito
    this.habitType.addEventListener("change", () => {
      this.toggleNumericConfig()
      this.updateTypeHelp()
    })

    // Toggle de recordatorio
    this.reminderCheckbox.addEventListener("change", () => {
      this.toggleReminderTime()
    })

    // Envío del formulario
    this.form.addEventListener("submit", (e) => {
      this.handleSubmit(e)
    })
  }

  toggleNumericConfig() {
    const isNumeric = this.habitType.value === "numeric"
    this.numericConfig.style.display = isNumeric ? "block" : "none"

    // Hacer campos requeridos o no según el tipo
    const targetInput = document.getElementById("habitTarget")
    const unitInput = document.getElementById("habitUnit")

    if (isNumeric) {
      targetInput.required = true
      unitInput.required = true
    } else {
      targetInput.required = false
      unitInput.required = false
      targetInput.value = ""
      unitInput.value = ""
    }
  }

  toggleReminderTime() {
    const showTime = this.reminderCheckbox.checked
    this.reminderTime.style.display = showTime ? "block" : "none"

    const timeInput = document.getElementById("reminderTimeInput")
    timeInput.required = showTime

    if (!showTime) {
      timeInput.value = ""
    }
  }

  updateTypeHelp() {
    const helpElement = document.getElementById("typeHelp")
    const selectedType = this.habitType.value

    let helpText = "Selecciona un tipo para ver más información"

    if (selectedType === "boolean") {
      helpText = "Perfecto para hábitos que se completan o no (ej: meditar, hacer ejercicio)"
    } else if (selectedType === "numeric") {
      helpText = "Ideal para hábitos con cantidad específica (ej: beber 8 vasos de agua)"
    }

    helpElement.textContent = helpText
  }

  validateForm(formData) {
    const errors = []

    if (!formData.habitName.trim()) {
      errors.push("El nombre del hábito es requerido")
    }

    if (!formData.habitType) {
      errors.push("Debes seleccionar un tipo de hábito")
    }

    if (formData.habitType === "numeric") {
      if (!formData.habitTarget || formData.habitTarget <= 0) {
        errors.push("La meta diaria debe ser mayor a 0")
      }
      if (!formData.habitUnit.trim()) {
        errors.push("La unidad es requerida para hábitos numéricos")
      }
    }

    if (formData.habitReminder && !formData.reminderTimeInput) {
      errors.push("Debes especificar la hora del recordatorio")
    }

    return errors
  }

  async handleSubmit(e) {
    e.preventDefault()

    try {
      window.Utils.showLoading()

      // Recopilar datos del formulario
      const formData = new FormData(this.form)
      const habitData = {
        id: window.Utils.generateId(),
        name: formData.get("habitName").trim(),
        description: formData.get("habitDescription").trim(),
        type: formData.get("habitType"),
        target: formData.get("habitTarget") ? Number.parseInt(formData.get("habitTarget")) : null,
        unit: formData.get("habitUnit") ? formData.get("habitUnit").trim() : null,
        reminder: formData.get("habitReminder") === "on",
        reminderTime: formData.get("reminderTimeInput") || null,
        createdAt: new Date().toISOString(),
        streak: 0,
        bestStreak: 0,
        totalDays: 0,
      }

      // Validar datos
      const errors = this.validateForm(habitData)
      if (errors.length > 0) {
        window.Utils.showNotification(errors[0], "error")
        return
      }

      // Enviar al servidor
      const response = await window.Utils.makeRequest("create-habit.php", {
        method: "POST",
        body: JSON.stringify(habitData),
      })

      if (response.success) {
        window.Utils.showNotification("¡Hábito creado exitosamente!")

        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
          window.location.href = "index.html"
        }, 1500)
      } else {
        throw new Error(response.message || "Error creando el hábito")
      }
    } catch (error) {
      console.error("Error creando hábito:", error)
      window.Utils.showNotification(error.message || "Error creando el hábito", "error")
    } finally {
      window.Utils.hideLoading()
    }
  }
}

// Inicializar formulario
document.addEventListener("DOMContentLoaded", () => {
  new AddHabitForm()
})
