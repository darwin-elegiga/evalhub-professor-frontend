import type { ExamQuestion } from "./question"

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
