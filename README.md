# Sistema de Exámenes Científicos

Plataforma para profesores que permite crear exámenes de ciencias con soporte para ecuaciones LaTeX, imágenes y gráficos. Gestiona estudiantes, asigna exámenes mediante magic links únicos y califica respuestas.

## Características

- **Autenticación de Profesores**: Sistema de login/registro
- **Creación de Exámenes**: Editor con soporte para:
  - Ecuaciones LaTeX (renderizadas con MathJax)
  - Imágenes
  - Gráficos
  - Preguntas de opción múltiple
- **Gestión de Estudiantes**: CRUD completo
- **Magic Links**: Enlaces únicos por estudiante para acceder a exámenes
- **Sistema de Calificación**: Calificación automática y manual con retroalimentación
- **Niveles de Examen**: Organización por dificultad

## Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: NestJS (separado)
- **UI Components**: shadcn/ui
- **Math Rendering**: MathJax

## Instalación

### 1. Clonar el repositorio

\`\`\`bash
git clone <repo-url>
cd science-exam-creator
\`\`\`

### 2. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 3. Configurar variables de entorno

Copia el archivo de ejemplo:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Edita `.env.local`:

\`\`\`env
# URL del backend NestJS
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Modo de desarrollo
# true = usar datos mockeados (no requiere backend)
# false = conectar al backend NestJS real
NEXT_PUBLIC_USE_MOCK=true
\`\`\`

### 4. Ejecutar en modo desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## Modos de Funcionamiento

### Modo Mock (Desarrollo sin Backend)

Configurar en `.env.local`:
\`\`\`env
NEXT_PUBLIC_USE_MOCK=true
\`\`\`

Este modo usa datos simulados hardcodeados en `lib/mock-data.ts`. No requiere backend NestJS funcionando.

**Credenciales de prueba:**
- Email: cualquier email
- Contraseña: cualquier contraseña

### Modo Producción (Con Backend NestJS)

Configurar en `.env.local`:
\`\`\`env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

Asegúrate de que tu backend NestJS esté corriendo en el puerto 3001 (o el que configures).

## API Endpoints Esperados

El frontend espera los siguientes endpoints del backend NestJS:

### Autenticación
- `POST /api/auth/login` - Login de profesor
- `POST /api/auth/register` - Registro de profesor
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### Estudiantes
- `GET /api/students` - Listar estudiantes
- `POST /api/students` - Crear estudiante
- `GET /api/students/:id` - Obtener estudiante
- `PUT /api/students/:id` - Actualizar estudiante
- `DELETE /api/students/:id` - Eliminar estudiante

### Exámenes
- `GET /api/exams` - Listar exámenes
- `POST /api/exams` - Crear examen
- `GET /api/exams/:id` - Obtener examen con preguntas
- `POST /api/exams/assign` - Asignar examen a estudiantes

### Asignaciones (Magic Links)
- `GET /api/assignments/token/:token` - Obtener examen por magic link
- `POST /api/assignments/start` - Iniciar examen
- `POST /api/assignments/answer` - Guardar respuesta
- `POST /api/assignments/submit` - Enviar examen completo

### Calificaciones
- `GET /api/grades` - Listar calificaciones
- `PATCH /api/grades/answer/:id` - Calificar respuesta individual
- `POST /api/grades/submit` - Finalizar calificación

## Estructura del Proyecto

\`\`\`
├── app/
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard del profesor
│   │   ├── exams/        # Gestión de exámenes
│   │   ├── students/     # Gestión de estudiantes
│   │   └── grades/       # Calificaciones
│   └── exam/[token]/     # Acceso de estudiantes via magic link
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   └── ...               # Componentes personalizados
├── lib/
│   ├── api-client.ts     # Cliente HTTP para backend
│   ├── api-config.ts     # Configuración de endpoints
│   ├── auth-context.tsx  # Contexto de autenticación
│   ├── mock-data.ts      # Datos simulados
│   └── types.ts          # TypeScript interfaces
└── public/               # Archivos estáticos
\`\`\`

## Desarrollo

### Agregar Datos Mock

Edita `lib/mock-data.ts` para agregar más datos de prueba.

### Conectar Backend Real

1. Asegúrate que tu backend NestJS implemente todos los endpoints listados
2. Configura `NEXT_PUBLIC_USE_MOCK=false` en `.env.local`
3. Actualiza `NEXT_PUBLIC_API_URL` con la URL correcta

## Producción

\`\`\`bash
npm run build
npm start
\`\`\`

## Licencia

MIT
