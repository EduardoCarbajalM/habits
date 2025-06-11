# Aplicación de Seguimiento de Hábitos

Una aplicación web moderna para el seguimiento de hábitos personales, construida con HTML, CSS, JavaScript vanilla, PHP y DynamoDB.

## Características

- **Dashboard interactivo** con estadísticas y visualizaciones
- **Creación de hábitos** con tipos booleanos y numéricos
- **Registro diario** con seguimiento de progreso
- **Visualización detallada** de cada hábito con gráficos históricos
- **Diseño responsivo** con colores suaves azules y verdes
- **Base de datos NoSQL** con DynamoDB para escalabilidad

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: PHP 7.4+
- **Base de datos**: AWS DynamoDB
- **Estilos**: CSS Grid, Flexbox, Variables CSS
- **Iconos**: Font Awesome 6

## Instalación

### Prerrequisitos

- PHP 7.4 o superior
- Composer
- Cuenta de AWS con acceso a DynamoDB
- Servidor web (Apache/Nginx) o PHP built-in server

### Pasos de instalación

1. **Clonar el repositorio**
   \`\`\`bash
   git clone <repository-url>
   cd habit-tracker-app
   \`\`\`

2. **Instalar dependencias**
   \`\`\`bash
   composer install
   \`\`\`

3. **Configurar variables de entorno**
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   
   Editar `.env` con tus credenciales de AWS:
   \`\`\`env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=tu_access_key
   AWS_SECRET_ACCESS_KEY=tu_secret_key
   TABLE_PREFIX=habit_tracker_
   \`\`\`

4. **Crear tablas en DynamoDB**
   \`\`\`bash
   composer run setup
   \`\`\`

5. **Iniciar servidor de desarrollo**
   \`\`\`bash
   php -S localhost:8000
   \`\`\`

6. **Abrir en el navegador**
   \`\`\`
   http://localhost:8000
   \`\`\`

## Estructura del proyecto

\`\`\`
habit-tracker-app/
├── index.html              # Dashboard principal
├── add-habit.html          # Formulario de nuevo hábito
├── habit-detail.html       # Detalle de hábito individual
├── daily-log.html          # Registro diario
├── assets/
│   ├── css/
│   │   └── style.css       # Estilos principales
│   └── js/
│       ├── common.js       # Utilidades comunes
│       ├── dashboard.js    # Lógica del dashboard
│       ├── add-habit.js    # Lógica del formulario
│       ├── habit-detail.js # Lógica del detalle
│       └── daily-log.js    # Lógica del registro diario
├── api/
│   ├── config.php          # Configuración de DynamoDB
│   ├── habits.php          # CRUD de hábitos
│   ├── create-habit.php    # Crear nuevo hábito
│   ├── save-progress.php   # Guardar progreso
│   ├── daily-habits.php    # Hábitos para registro diario
│   └── save-daily-log.php  # Guardar registro diario
├── setup/
│   └── create-tables.php   # Script para crear tablas
├── composer.json           # Dependencias PHP
├── .env.example           # Ejemplo de variables de entorno
└── README.md              # Este archivo
\`\`\`

## Estructura de la base de datos

### Tabla: habits
- **Clave primaria**: `id` (String)
- **Atributos**:
  - `name`: Nombre del hábito
  - `description`: Descripción opcional
  - `type`: 'boolean' o 'numeric'
  - `target`: Meta diaria (solo para numéricos)
  - `unit`: Unidad de medida (solo para numéricos)
  - `streak`: Racha actual
  - `bestStreak`: Mejor racha
  - `totalDays`: Total de días registrados
  - `reminder`: Recordatorio activado
  - `reminderTime`: Hora del recordatorio
  - `createdAt`, `updatedAt`: Timestamps

### Tabla: records
- **Clave primaria**: `habitId` (String) + `date` (String)
- **Atributos**:
  - `value`: Valor registrado
  - `completed`: Si se completó la meta
  - `target`: Meta del día
  - `notes`: Notas opcionales
  - `createdAt`, `updatedAt`: Timestamps

### Tabla: daily_notes
- **Clave primaria**: `date` (String)
- **Atributos**:
  - `notes`: Notas del día
  - `createdAt`, `updatedAt`: Timestamps

## API Endpoints

### Hábitos
- `GET /api/habits.php` - Obtener todos los hábitos
- `POST /api/create-habit.php` - Crear nuevo hábito
- `PUT /api/habits.php` - Actualizar hábito
- `DELETE /api/habits.php` - Eliminar hábito

### Registros
- `POST /api/save-progress.php` - Guardar progreso individual
- `GET /api/daily-habits.php` - Obtener hábitos para registro diario
- `POST /api/save-daily-log.php` - Guardar registro diario completo

## Características técnicas

### Frontend
- **Diseño responsivo** con CSS Grid y Flexbox
- **Variables CSS** para temas consistentes
- **JavaScript modular** con clases ES6
- **Gestión de estado** local sin frameworks
- **Gráficos personalizados** con Canvas API
- **Notificaciones** toast personalizadas

### Backend
- **API RESTful** con PHP
- **Validación de datos** robusta
- **Manejo de errores** centralizado
- **Logging** de errores
- **CORS** configurado para desarrollo

### Base de datos
- **DynamoDB** para escalabilidad
- **Diseño NoSQL** optimizado
- **Índices secundarios** para consultas eficientes
- **Cálculo de rachas** automático

## Desarrollo

### Agregar nuevas características

1. **Frontend**: Crear nuevos archivos HTML/JS en la estructura existente
2. **Backend**: Agregar nuevos endpoints en `/api/`
3. **Base de datos**: Modificar tablas o crear nuevas según necesidad

### Debugging

- Los logs de error se escriben en el log de PHP
- Usar las herramientas de desarrollador del navegador
- Verificar la consola de AWS para errores de DynamoDB

## Despliegue

### Producción

1. **Configurar servidor web** (Apache/Nginx)
2. **Configurar variables de entorno** de producción
3. **Optimizar autoloader** de Composer
4. **Configurar HTTPS**
5. **Configurar backup** de DynamoDB

### Variables de entorno de producción

\`\`\`env
APP_ENV=production
APP_DEBUG=false
AWS_REGION=us-east-1
TABLE_PREFIX=prod_habit_tracker_
\`\`\`

## Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para reportar bugs o solicitar características, crear un issue en el repositorio.
