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
  teacherId: string
  subjectId: string // Relación con la asignatura
  name: string
  description: string | null
  color: string // Para UI (e.g., "blue", "green", "red")
  createdAt: string
}

// ============================================
// QUESTION TYPE CONFIGURATIONS
// ============================================

export interface MultipleChoiceConfig {
  options: {
    id: string
    text: string // HTML from Tiptap
    isCorrect: boolean
    order: number
  }[]
  allowMultiple: boolean // Permitir selección múltiple
  shuffleOptions: boolean // Mezclar opciones al mostrar
}

export interface NumericConfig {
  correctValue: number
  tolerance: number // Porcentaje o valor absoluto
  toleranceType: "percentage" | "absolute"
  unit: string | null // Unidad esperada (e.g., "m/s", "kg")
  showUnitInput: boolean
}

export interface GraphClickConfig {
  graphType: "cartesian" | "polar" | "custom_image"
  imageUrl: string | null // Para gráficos personalizados
  correctPoint: { x: number; y: number }
  toleranceRadius: number // Radio de tolerancia en píxeles o unidades
  xRange: [number, number]
  yRange: [number, number]
  gridVisible: boolean
  axisLabels: { x: string; y: string }
}

export interface ImageHotspotConfig {
  imageUrl: string
  hotspots: {
    id: string
    type: "circle" | "rectangle" | "polygon"
    coordinates: number[] // [x, y, radius] para círculo, [x1, y1, x2, y2] para rectángulo, etc.
    isCorrect: boolean
    label: string | null
  }[]
  allowMultipleSelections: boolean
}

export interface OpenTextConfig {
  maxLength: number | null
  placeholder: string | null
  allowLatex: boolean
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
  teacherId: string
  subjectId: string | null
  topicId: string | null

  // Contenido
  title: string // Título corto para identificación
  content: string // HTML del editor Tiptap (enunciado completo)

  // Tipo y configuración
  questionType: QuestionType
  typeConfig: QuestionConfig["config"]

  // Metadatos
  difficulty: QuestionDifficulty
  estimatedTimeMinutes: number | null
  tags: string[]

  // Peso relativo (1-10) para el cálculo del promedio en exámenes
  weight: number

  // Timestamps
  createdAt: string
  updatedAt: string

  // Estadísticas (opcionales, calculadas)
  timesUsed?: number
  averageScore?: number | null // Promedio de calificaciones (2-5) en usos anteriores
}

// Pregunta dentro de un examen (referencia a BankQuestion)
export interface ExamQuestion {
  id: string
  examId: string
  questionId: string // ID de la pregunta del banco
  questionOrder: number
  weight: number // Peso relativo (puede diferir del weight del banco)

  // Configuración específica para este examen
  shuffleOptions?: boolean // Override para este examen

  // Relación expandida (para queries)
  bankQuestion?: BankQuestion
}
