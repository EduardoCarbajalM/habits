# Configuración del Sistema de Autenticación

## Descripción General

El sistema de autenticación implementado utiliza sesiones PHP y DynamoDB para gestionar usuarios de forma segura. Incluye registro, login, logout y protección de rutas.

## Características Implementadas

### 1. Páginas de Autenticación
- **login.html**: Página de inicio de sesión con validación
- **register.html**: Página de registro con validación de contraseña
- Diseño responsivo con tema consistente
- Validación en tiempo real de contraseñas
- Opción "Recordarme" para sesiones extendidas

### 2. Backend de Autenticación
- **auth.php**: Manejo de login y registro
- **check-auth.php**: Verificación de estado de autenticación
- **logout.php**: Cierre de sesión seguro
- **middleware.php**: Protección de endpoints

### 3. Seguridad Implementada
- Hashing de contraseñas con `password_hash()`
- Validación de email y contraseñas robustas
- Protección CSRF mediante verificación de sesión
- Separación de datos por usuario (userId en todos los recursos)

### 4. Gestión de Sesiones
- Sesiones PHP nativas
- Cookies de sesión configurables
- Limpieza automática al cerrar sesión
- Verificación de autenticación en cada request

## Estructura de Base de Datos

### Tabla: users
\`\`\`
- id (String, Primary Key): UUID único del usuario
- firstName (String): Nombre del usuario
- lastName (String): Apellido del usuario  
- email (String, GSI): Email único del usuario
- password (String): Hash de la contraseña
- status (String): Estado de la cuenta (active/inactive)
- newsletter (Boolean): Suscripción a newsletter
- createdAt (String): Timestamp de creación
- updatedAt (String): Timestamp de última actualización
- lastLogin (String): Timestamp del último login
- loginCount (Number): Contador de logins
\`\`\`

### Índice Secundario Global (GSI)
- **EmailIndex**: Permite búsquedas eficientes por email

## Flujo de Autenticación

### 1. Registro de Usuario
1. Usuario completa formulario de registro
2. Validación frontend (email, contraseña, términos)
3. Envío a `auth.php` con action='register'
4. Validación backend y verificación de email único
5. Creación de usuario con contraseña hasheada
6. Inicio de sesión automático
7. Redirección al dashboard

### 2. Inicio de Sesión
1. Usuario ingresa credenciales
2. Validación frontend básica
3. Envío a `auth.php` con action='login'
4. Verificación de credenciales en DynamoDB
5. Creación de sesión PHP
6. Actualización de lastLogin
7. Redirección al dashboard

### 3. Protección de Rutas
1. Cada página protegida carga `auth.js`
2. `auth.js` verifica estado con `check-auth.php`
3. Si no autenticado, redirección a login
4. Si autenticado, renderiza menú de usuario

### 4. Cierre de Sesión
1. Usuario hace clic en "Cerrar Sesión"
2. Llamada a `logout.php`
3. Destrucción de sesión y cookies
4. Redirección a login

## Integración con Hábitos

### Modificaciones Realizadas
1. **Tabla habits**: Agregado campo `userId` para asociar hábitos con usuarios
2. **API endpoints**: Filtrado automático por usuario autenticado
3. **Middleware**: Verificación de propiedad de recursos
4. **Frontend**: Menú de usuario en todas las páginas protegidas

### Verificación de Propiedad
- Todos los hábitos incluyen `userId` del propietario
- Los endpoints verifican que el usuario solo acceda a sus propios datos
- Error 403 si intenta acceder a recursos de otro usuario

## Configuración de Desarrollo

### 1. Variables de Entorno
\`\`\`env
# Agregar a .env
SESSION_LIFETIME=3600
REMEMBER_ME_LIFETIME=2592000
SECURE_COOKIES=false
\`\`\`

### 2. Configuración de PHP
\`\`\`php
// En config.php, agregar:
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Lax');
\`\`\`

### 3. Crear Tablas
\`\`\`bash
# Ejecutar script de creación
php setup/create-tables.php
\`\`\`

## Seguridad y Mejores Prácticas

### 1. Contraseñas
- Mínimo 8 caracteres
- Validación de fortaleza en frontend
- Hash seguro con `password_hash()`
- Verificación con `password_verify()`

### 2. Sesiones
- Regeneración de ID de sesión en login
- Limpieza completa en logout
- Timeout configurable
- Cookies HttpOnly

### 3. Validación
- Sanitización de inputs
- Validación de email con filtros PHP
- Verificación de tipos de datos
- Escape de salidas

### 4. Errores
- Mensajes genéricos para seguridad
- Logging detallado en servidor
- No exposición de información sensible

## Testing

### 1. Casos de Prueba
- Registro con datos válidos/inválidos
- Login con credenciales correctas/incorrectas
- Acceso a páginas protegidas sin autenticación
- Verificación de separación de datos entre usuarios
- Cierre de sesión y limpieza

### 2. Comandos de Testing
\`\`\`bash
# Verificar creación de tablas
php setup/create-tables.php

# Probar endpoints
curl -X POST http://localhost:8000/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"action":"register","firstName":"Test","lastName":"User","email":"test@example.com","password":"password123","confirmPassword":"password123","acceptTerms":true}'
\`\`\`

## Próximos Pasos

### 1. Funcionalidades Adicionales
- Recuperación de contraseña
- Verificación de email
- Autenticación de dos factores
- OAuth con Google/Facebook

### 2. Mejoras de Seguridad
- Rate limiting para login
- Bloqueo de cuentas por intentos fallidos
- Auditoría de accesos
- Encriptación de datos sensibles

### 3. UX/UI
- Recordar último email usado
- Indicador de fortaleza de contraseña mejorado
- Notificaciones de seguridad
- Configuración de perfil de usuario

## Troubleshooting

### Problemas Comunes

1. **Error "No autenticado"**
   - Verificar que las sesiones estén habilitadas
   - Comprobar configuración de cookies
   - Revisar logs de PHP

2. **Usuario no puede registrarse**
   - Verificar conexión a DynamoDB
   - Comprobar que la tabla users existe
   - Revisar validaciones de email

3. **Sesión se pierde**
   - Verificar configuración de session.gc_maxlifetime
   - Comprobar que no hay conflictos de cookies
   - Revisar configuración del servidor web

### Logs Útiles
\`\`\`bash
# Ver logs de PHP
tail -f /var/log/php_errors.log

# Ver logs de aplicación
tail -f /var/log/apache2/error.log
