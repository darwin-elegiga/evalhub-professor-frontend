import type { ExamQuestion } from "./question"

export interface Exam {
  id: string
  teacherId: string
  subjectId: string | null
  title: string
  description: string | null
  durationMinutes: number | null
  createdAt: string
  updatedAt: string
}

export interface ExamAssignment {
  id: string
  examId: string
  groupId: string | null
  title: string
  assignedAt: string
  dueDate: string | null
  createdAt: string
}

export interface StudentExamAssignment {
  id: string
  examAssignmentId: string
  examId: string
  studentId: string
  magicToken: string
  assignedAt: string
  startedAt: string | null
  submittedAt: string | null
  status: "pending" | "in_progress" | "submitted" | "graded"
}

// Configuración del examen
export interface ExamConfig {
  shuffleQuestions: boolean
  shuffleOptions: boolean // Global para todas las preguntas
  showResultsImmediately: boolean
  allowReview: boolean
  penaltyPerWrongAnswer: number | null // Penalización (0-1, ej: 0.25 = -25%)
  passingPercentage: number // Porcentaje mínimo para aprobar
}

// Configuración por defecto de exámenes (obtenida del backend)
export interface ExamDefaultConfig {
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showResultsImmediately: boolean
  penaltyEnabled: boolean
  penaltyValue: number // Valor de penalización (0-1, ej: 0.25 = 25%)
  passingPercentage: number // Porcentaje mínimo para aprobar (0-100)
}

// Examen extendido con la nueva estructura
export interface ExamWithConfig extends Exam {
  config: ExamConfig
  questions?: ExamQuestion[]
}

// Question in an exam (reference to bank question)
export interface ExamQuestionRef {
  id: string
  examId: string
  questionId: string
  questionOrder: number
  weight: number
}
