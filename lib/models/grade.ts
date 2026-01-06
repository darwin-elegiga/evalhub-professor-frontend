// Calificación por pregunta (escala 2-5, igual que la nota final)
export type QuestionScore = 2 | 3 | 4 | 5

// Tipo para el redondeo de calificación
export type GradeRoundingMethod = "floor" | "ceil" // Por defecto o por exceso

// Calificación final del examen (escala 2-5)
export type FinalGrade = 2 | 3 | 4 | 5

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

export interface Grade {
  id: string
  assignment_id: string
  average_score: number // Promedio de las calificaciones de preguntas (2-5)
  final_grade: FinalGrade // Calificación final redondeada (2-5)
  rounding_method: GradeRoundingMethod // Método de redondeo usado
  graded_at: string
  graded_by: string | null
}
