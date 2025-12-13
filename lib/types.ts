export interface Teacher {
  id: string
  full_name: string
  email: string
  created_at: string
}

export interface Student {
  id: string
  teacher_id: string
  full_name: string
  email: string
  created_at: string
}

export interface ExamLevel {
  id: string
  teacher_id: string
  name: string
  description: string | null
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

export interface StudentExamAssignment {
  id: string
  exam_id: string
  student_id: string
  magic_token: string
  assigned_at: string
  started_at: string | null
  submitted_at: string | null
  status: "pending" | "in_progress" | "submitted" | "graded"
}

export interface StudentAnswer {
  id: string
  assignment_id: string
  question_id: string
  selected_option_id: string | null
  answer_text: string | null
  answer_latex: string | null
  points_earned: number
  feedback: string | null
  created_at: string
}

export interface Grade {
  id: string
  assignment_id: string
  total_points: number
  points_earned: number
  percentage: number
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

  // Puntuación sugerida
  default_points: number

  // Timestamps
  created_at: string
  updated_at: string

  // Estadísticas (opcionales, calculadas)
  times_used?: number
  average_score?: number
}

// Pregunta dentro de un examen (referencia a BankQuestion)
export interface ExamQuestion {
  id: string
  exam_id: string
  bank_question_id: string
  question_order: number
  points: number // Puede diferir del default_points

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

// Examen extendido con la nueva estructura
export interface ExamWithConfig extends Exam {
  config: ExamConfig
  questions?: ExamQuestion[]
}
