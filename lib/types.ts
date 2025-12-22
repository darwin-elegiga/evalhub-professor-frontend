export interface Teacher {
  id: string
  full_name: string
  email: string
  created_at: string
}

export interface StudentGroup {
  id: string
  teacher_id: string
  name: string
  year: number
  career: string
  created_at: string
}

export interface Student {
  id: string
  teacher_id: string
  group_id: string | null
  full_name: string
  email: string
  year: number | null
  career: string | null
  created_at: string
}

export interface ExamLevel {
  id: string
  teacher_id: string
  name: string
  description: string | null
  created_at: string
}

// Asignatura/Materia (ej: Física, Matemáticas, Química)
export interface Subject {
  id: string
  teacher_id: string
  name: string
  description: string | null
  color: string // Para UI (e.g., "blue", "green", "red")
  created_at: string
}

export interface Exam {
  id: string
  teacher_id: string
  level_id: string | null
  title: string
  description: string | null
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  exam_id: string
  question_text: string
  question_latex: string | null
  question_image_url: string | null
  question_graph_data: any | null
  question_order: number
  points: number
  created_at: string
}

export interface AnswerOption {
  id: string
  question_id: string
  option_text: string
  option_latex: string | null
  option_image_url: string | null
  is_correct: boolean
  option_order: number
  created_at: string
}

export interface ExamAssignment {
  id: string
  exam_id: string
  group_id: string | null
  title: string
  assigned_at: string
  due_date: string | null
  created_at: string
}

export interface StudentExamAssignment {
  id: string
  exam_assignment_id: string
  exam_id: string
  student_id: string
  magic_token: string
  assigned_at: string
  started_at: string | null
  submitted_at: string | null
  status: "pending" | "in_progress" | "submitted" | "graded"
}

// ============================================
// EXAM MONITORING EVENTS
// ============================================

export type ExamEventType =
  | "tab_hidden"           // Estudiante salió de la pestaña (visibilitychange)
  | "tab_visible"          // Estudiante volvió a la pestaña
  | "window_blur"          // Ventana perdió el foco
  | "window_focus"         // Ventana recuperó el foco
  | "copy"                 // Estudiante copió texto
  | "paste"                // Estudiante pegó texto (potencial de fuente externa)
  | "cut"                  // Estudiante cortó texto
  | "right_click"          // Click derecho (intento de menú contextual)
  | "fullscreen_exit"      // Salió de pantalla completa
  | "devtools_open"        // Intento de abrir DevTools detectado
  | "screenshot_attempt"   // Intento de captura de pantalla (limitado)
  | "print_attempt"        // Intento de imprimir
  | "keyboard_shortcut"    // Atajo de teclado sospechoso (Ctrl+C fuera de input, etc.)
  | "idle_timeout"         // Inactividad prolongada
  | "rapid_answers"        // Respuestas muy rápidas (sospechoso)
  | "browser_resize"       // Cambio de tamaño de ventana significativo
  | "connection_lost"      // Pérdida de conexión
  | "connection_restored"  // Conexión restaurada
  | "exam_started"         // Inicio del examen
  | "exam_submitted"       // Envío del examen

export type ExamEventSeverity = "info" | "warning" | "critical"

export interface ExamEvent {
  id: string
  assignment_id: string
  event_type: ExamEventType
  severity: ExamEventSeverity
  timestamp: string
  details: {
    // Datos específicos del evento
    duration_seconds?: number      // Para tab_hidden: cuánto tiempo estuvo fuera
    pasted_length?: number         // Para paste: longitud del texto pegado
    shortcut_keys?: string         // Para keyboard_shortcut: teclas presionadas
    idle_duration_seconds?: number // Para idle_timeout: duración de inactividad
    question_index?: number        // Pregunta actual al momento del evento
    answer_time_seconds?: number   // Para rapid_answers: tiempo por respuesta
    window_dimensions?: {          // Para browser_resize
      width: number
      height: number
    }
    message?: string               // Descripción adicional
  }
}

// Calificación por pregunta (escala 2-5, igual que la nota final)
export type QuestionScore = 2 | 3 | 4 | 5

export interface StudentAnswer {
  id: string
  assignment_id: string
  question_id: string
  selected_option_id: string | null
  answer_text: string | null
  answer_latex: string | null
  score: QuestionScore // Calificación por pregunta (2-5)
  feedback: string | null
  created_at: string
}

// Tipo para el redondeo de calificación
export type GradeRoundingMethod = "floor" | "ceil" // Por defecto o por exceso

// Calificación final del examen (escala 2-5)
export type FinalGrade = 2 | 3 | 4 | 5

export interface Grade {
  id: string
  assignment_id: string
  average_score: number // Promedio de las calificaciones de preguntas (2-5)
  final_grade: FinalGrade // Calificación final redondeada (2-5)
  rounding_method: GradeRoundingMethod // Método de redondeo usado
  graded_at: string
  graded_by: string | null
}

// ============================================
// QUESTION BANK TYPES
// ============================================

export type QuestionType =
  | "multiple_choice"    // Opción múltiple tradicional
  | "numeric"            // Respuesta numérica con tolerancia
  | "graph_click"        // Click en punto de gráfico
  | "image_hotspot"      // Marcar zona en imagen
  | "open_text"          // Respuesta abierta

export type QuestionDifficulty = "easy" | "medium" | "hard"

export interface QuestionTopic {
  id: string
  teacher_id: string
  subject_id: string // Relación con la asignatura
  name: string
  description: string | null
  color: string // Para UI (e.g., "blue", "green", "red")
  created_at: string
}

// Configuración específica para cada tipo de pregunta
export interface MultipleChoiceConfig {
  options: {
    id: string
    text: string // HTML from Tiptap
    is_correct: boolean
    order: number
  }[]
  allow_multiple: boolean // Permitir selección múltiple
  shuffle_options: boolean // Mezclar opciones al mostrar
}

export interface NumericConfig {
  correct_value: number
  tolerance: number // Porcentaje o valor absoluto
  tolerance_type: "percentage" | "absolute"
  unit: string | null // Unidad esperada (e.g., "m/s", "kg")
  show_unit_input: boolean
}

export interface GraphClickConfig {
  graph_type: "cartesian" | "polar" | "custom_image"
  image_url: string | null // Para gráficos personalizados
  correct_point: { x: number; y: number }
  tolerance_radius: number // Radio de tolerancia en píxeles o unidades
  x_range: [number, number]
  y_range: [number, number]
  grid_visible: boolean
  axis_labels: { x: string; y: string }
}

export interface ImageHotspotConfig {
  image_url: string
  hotspots: {
    id: string
    type: "circle" | "rectangle" | "polygon"
    coordinates: number[] // [x, y, radius] para círculo, [x1, y1, x2, y2] para rectángulo, etc.
    is_correct: boolean
    label: string | null
  }[]
  allow_multiple_selections: boolean
}

export interface OpenTextConfig {
  max_length: number | null
  placeholder: string | null
  allow_latex: boolean
  keywords: string[] // Palabras clave para auto-evaluación parcial
}

export type QuestionConfig =
  | { type: "multiple_choice"; config: MultipleChoiceConfig }
  | { type: "numeric"; config: NumericConfig }
  | { type: "graph_click"; config: GraphClickConfig }
  | { type: "image_hotspot"; config: ImageHotspotConfig }
  | { type: "open_text"; config: OpenTextConfig }

// Pregunta del banco de preguntas
export interface BankQuestion {
  id: string
  teacher_id: string
  subject_id: string | null
  topic_id: string | null

  // Contenido
  title: string // Título corto para identificación
  content: string // HTML del editor Tiptap (enunciado completo)

  // Tipo y configuración
  question_type: QuestionType
  type_config: QuestionConfig["config"]

  // Metadatos
  difficulty: QuestionDifficulty
  estimated_time_minutes: number | null
  tags: string[]

  // Peso relativo (1-10) para el cálculo del promedio en exámenes
  weight: number

  // Timestamps
  created_at: string
  updated_at: string

  // Estadísticas (opcionales, calculadas)
  times_used?: number
  average_score?: number // Promedio de calificaciones (2-5) en usos anteriores
}

// Pregunta dentro de un examen (referencia a BankQuestion)
export interface ExamQuestion {
  id: string
  exam_id: string
  bank_question_id: string
  question_order: number
  weight: number // Peso relativo (puede diferir del weight del banco)

  // Configuración específica para este examen
  shuffle_options?: boolean // Override para este examen

  // Relación expandida (para queries)
  bank_question?: BankQuestion
}

// Configuración del examen
export interface ExamConfig {
  shuffle_questions: boolean
  shuffle_options: boolean // Global para todas las preguntas
  show_results_immediately: boolean
  allow_review: boolean
  penalty_per_wrong_answer: number | null // Penalización (0-1, ej: 0.25 = -25%)
  passing_percentage: number // Porcentaje mínimo para aprobar
}

// Configuración por defecto de exámenes (obtenida del backend)
export interface ExamDefaultConfig {
  shuffle_questions: boolean
  shuffle_options: boolean
  show_results_immediately: boolean
  penalty_enabled: boolean
  penalty_value: number // Valor de penalización (0-1, ej: 0.25 = 25%)
  passing_percentage: number // Porcentaje mínimo para aprobar (0-100)
}

// Examen extendido con la nueva estructura
export interface ExamWithConfig extends Exam {
  config: ExamConfig
  questions?: ExamQuestion[]
}
