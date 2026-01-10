// Calificación por pregunta (escala 2-5, igual que la nota final)
export type QuestionScore = 2 | 3 | 4 | 5

// Tipo para el redondeo de calificación
export type GradeRoundingMethod = "floor" | "ceil" | "round"

// Calificación final del examen (escala 2-5)
export type FinalGrade = 2 | 3 | 4 | 5

export interface StudentAnswer {
  id: string
  assignmentId: string
  questionId: string
  selectedOptionId: string | null
  answerText: string | null
  answerNumeric: number | null
  score: QuestionScore | null // Calificación por pregunta (2-5), null si no calificada
  feedback: string | null
  createdAt: string
}

export interface Grade {
  id: string
  assignmentId: string
  averageScore: number // Promedio de las calificaciones de preguntas (2-5)
  finalGrade: FinalGrade // Calificación final redondeada (2-5)
  roundingMethod: GradeRoundingMethod // Método de redondeo usado
  gradedAt: string
  gradedBy: string | null
}

// Grade with embedded student and exam info (for list view)
export interface GradeWithDetails extends Grade {
  student: {
    id: string
    fullName: string
    email: string
    career: string | null
  }
  exam: {
    id: string
    title: string
  }
}
