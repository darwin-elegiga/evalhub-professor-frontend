// ============================================
// QUESTION TYPES
// ============================================

export type QuestionType =
  | "multiple_choice"    // Opción múltiple tradicional
  | "numeric"            // Respuesta numérica con tolerancia
  | "graph_click"        // Click en punto de gráfico
  | "image_hotspot"      // Marcar zona en imagen
  | "open_text"          // Respuesta abierta

export type QuestionDifficulty = "easy" | "medium" | "hard"

// ============================================
// LEGACY QUESTION (for backward compatibility)
// ============================================

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

// ============================================
// QUESTION TOPICS
// ============================================

export interface QuestionTopic {
  id: string
  teacher_id: string
  subject_id: string // Relación con la asignatura
  name: string
  description: string | null
  color: string // Para UI (e.g., "blue", "green", "red")
  created_at: string
}

// ============================================
// QUESTION TYPE CONFIGURATIONS
// ============================================

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

// ============================================
// QUESTION BANK
// ============================================

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
