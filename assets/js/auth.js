class AuthManager {
  constructor() {
    this.currentUser = null
    this.init()
  }

  init() {
    this.checkAuthStatus()
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById("loginForm")
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e))
    }

    // Register form
    const registerForm = document.getElementById("registerForm")
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => this.handleRegister(e))
      this.setupPasswordValidation()
    }

    // User dropdown
    const userButton = document.querySelector(".user-button")
    if (userButton) {
      userButton.addEventListener("click", (e) => {
        e.stopPropagation()
        this.toggleUserDropdown()
      })
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      this.closeUserDropdown()
    })
  }

  setupPasswordValidation() {
    const passwordInput = document.getElementById("password")
    const confirmPasswordInput = document.getElementById("confirmPassword")

    if (passwordInput) {
      passwordInput.addEventListener("input", () => {
        this.validatePasswordStrength(passwordInput.value)
      })
    }

    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener("input", () => {
        this.validatePasswordMatch()
      })
    }
  }

  validatePasswordStrength(password) {
    const strengthFill = document.getElementById("strengthFill")
    const strengthText = document.getElementById("strengthText")

    if (!strengthFill || !strengthText) return

    let strength = 0
    let text = "Muy débil"
    let className = "weak"

    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    switch (strength) {
      case 0:
      case 1:
        text = "Muy débil"
        className = "weak"
        break
      case 2:
        text = "Débil"
        className = "weak"
        break
      case 3:
        text = "Regular"
        className = "fair"
        break
      case 4:
        text = "Buena"
        className = "good"
        break
      case 5:
        text = "Muy fuerte"
        className = "strong"
        break
    }

    strengthFill.className = `strength-fill ${className}`
    strengthText.textContent = text
  }

  validatePasswordMatch() {
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirmPassword").value
    const confirmInput = document.getElementById("confirmPassword")

    if (confirmPassword && password !== confirmPassword) {
      confirmInput.setCustomValidity("Las contraseñas no coinciden")
    } else {
      confirmInput.setCustomValidity("")
    }
  }

  async handleLogin(e) {
    e.preventDefault()

    try {
      window.Utils.showLoading()

      const formData = new FormData(e.target)
      const loginData = {
        email: formData.get("email").trim().toLowerCase(),
        password: formData.get("password"),
        rememberMe: formData.get("rememberMe") === "on",
      }

      // Validaciones básicas
      if (!this.validateEmail(loginData.email)) {
        window.Utils.showNotification("Por favor ingresa un email válido", "error")
        return
      }

      if (loginData.password.length < 8) {
        window.Utils.showNotification("La contraseña debe tener al menos 8 caracteres", "error")
        return
      }

      const response = await window.Utils.makeRequest("auth.php", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          ...loginData,
        }),
      })

      if (response.success) {
        window.Utils.showNotification("¡Bienvenido de vuelta!")
        this.currentUser = response.user

        // Guardar en localStorage si "recordarme" está marcado
        if (loginData.rememberMe) {
          localStorage.setItem("rememberUser", "true")
        }

        // Redirigir al dashboard
        setTimeout(() => {
          window.location.href = "index.html"
        }, 1000)
      } else {
        window.Utils.showNotification(response.message || "Error al iniciar sesión", "error")
      }
    } catch (error) {
      console.error("Error en login:", error)
      window.Utils.showNotification("Error de conexión. Intenta de nuevo.", "error")
    } finally {
      window.Utils.hideLoading()
    }
  }

  async handleRegister(e) {
    e.preventDefault()

    try {
      window.Utils.showLoading()

      const formData = new FormData(e.target)
      const registerData = {
        firstName: formData.get("firstName").trim(),
        lastName: formData.get("lastName").trim(),
        email: formData.get("email").trim().toLowerCase(),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
        acceptTerms: formData.get("acceptTerms") === "on",
        newsletter: formData.get("newsletter") === "on",
      }

      // Validaciones
      const validationErrors = this.validateRegistrationData(registerData)
      if (validationErrors.length > 0) {
        window.Utils.showNotification(validationErrors[0], "error")
        return
      }

      const response = await window.Utils.makeRequest("auth.php", {
        method: "POST",
        body: JSON.stringify({
          action: "register",
          ...registerData,
        }),
      })

      if (response.success) {
        window.Utils.showNotification("¡Cuenta creada exitosamente! Iniciando sesión...")
        this.currentUser = response.user

        // Redirigir al dashboard
        setTimeout(() => {
          window.location.href = "index.html"
        }, 1500)
      } else {
        window.Utils.showNotification(response.message || "Error al crear la cuenta", "error")
      }
    } catch (error) {
      console.error("Error en registro:", error)
      window.Utils.showNotification("Error de conexión. Intenta de nuevo.", "error")
    } finally {
      window.Utils.hideLoading()
    }
  }

  validateRegistrationData(data) {
    const errors = []

    if (!data.firstName || data.firstName.length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres")
    }

    if (!data.lastName || data.lastName.length < 2) {
      errors.push("El apellido debe tener al menos 2 caracteres")
    }

    if (!this.validateEmail(data.email)) {
      errors.push("Por favor ingresa un email válido")
    }

    if (data.password.length < 8) {
      errors.push("La contraseña debe tener al menos 8 caracteres")
    }

    if (data.password !== data.confirmPassword) {
      errors.push("Las contraseñas no coinciden")
    }

    if (!data.acceptTerms) {
      errors.push("Debes aceptar los términos y condiciones")
    }

    return errors
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async checkAuthStatus() {
    try {
      const response = await window.Utils.makeRequest("check-auth.php")

      if (response.authenticated) {
        this.currentUser = response.user
        this.renderUserMenu()
      } else {
        // Si estamos en una página protegida, redirigir al login
        if (this.isProtectedPage()) {
          window.location.href = "login.html"
        }
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error)
      if (this.isProtectedPage()) {
        window.location.href = "login.html"
      }
    }
  }

  isProtectedPage() {
    const protectedPages = ["index.html", "add-habit.html", "habit-detail.html", "daily-log.html"]
    const currentPage = window.location.pathname.split("/").pop() || "index.html"
    return protectedPages.includes(currentPage)
  }

  renderUserMenu() {
    const headerContent = document.querySelector(".header-content")
    if (!headerContent || !this.currentUser) return

    // Buscar si ya existe el menú de usuario
    let userMenu = document.querySelector(".user-menu")
    if (userMenu) {
      userMenu.remove()
    }

    const userInitials = this.getUserInitials(this.currentUser.firstName, this.currentUser.lastName)

    userMenu = document.createElement("div")
    userMenu.className = "user-menu"
    userMenu.innerHTML = `
            <button class="user-button">
                <div class="user-avatar">${userInitials}</div>
                <span class="user-name">${this.currentUser.firstName}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="user-dropdown">
                <a href="#" class="dropdown-item">
                    <i class="fas fa-user"></i>
                    Mi Perfil
                </a>
                <a href="#" class="dropdown-item">
                    <i class="fas fa-cog"></i>
                    Configuración
                </a>
                <a href="#" class="dropdown-item">
                    <i class="fas fa-chart-bar"></i>
                    Estadísticas
                </a>
                <hr style="margin: 0; border: none; border-top: 1px solid var(--gray-200);">
                <a href="#" class="dropdown-item logout" onclick="authManager.logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    Cerrar Sesión
                </a>
            </div>
        `

    headerContent.appendChild(userMenu)

    // Reconfigurar event listeners
    const userButton = userMenu.querySelector(".user-button")
    userButton.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggleUserDropdown()
    })
  }

  getUserInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : ""
    const last = lastName ? lastName.charAt(0).toUpperCase() : ""
    return first + last
  }

  toggleUserDropdown() {
    const dropdown = document.querySelector(".user-dropdown")
    if (dropdown) {
      dropdown.classList.toggle("show")
    }
  }

  closeUserDropdown() {
    const dropdown = document.querySelector(".user-dropdown")
    if (dropdown) {
      dropdown.classList.remove("show")
    }
  }

  async logout() {
    try {
      window.Utils.showLoading()

      await window.Utils.makeRequest("logout.php", {
        method: "POST",
      })

      // Limpiar datos locales
      this.currentUser = null
      localStorage.removeItem("rememberUser")

      window.Utils.showNotification("Sesión cerrada correctamente")

      // Redirigir al login
      setTimeout(() => {
        window.location.href = "login.html"
      }, 1000)
    } catch (error) {
      console.error("Error cerrando sesión:", error)
      // Forzar redirección incluso si hay error
      window.location.href = "login.html"
    } finally {
      window.Utils.hideLoading()
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  isAuthenticated() {
    return this.currentUser !== null
  }
}

// Función global para toggle de contraseña
window.togglePassword = (inputId) => {
  const input = document.getElementById(inputId)
  const eye = document.getElementById(`${inputId}-eye`)

  if (input.type === "password") {
    input.type = "text"
    eye.className = "fas fa-eye-slash"
  } else {
    input.type = "password"
    eye.className = "fas fa-eye"
  }
}

// Inicializar el gestor de autenticación
document.addEventListener("DOMContentLoaded", () => {
  window.authManager = new AuthManager()
})
