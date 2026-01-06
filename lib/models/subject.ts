// Asignatura/Materia (ej: Física, Matemáticas, Química)
export interface Subject {
  id: string
  teacher_id: string
  name: string
  description: string | null
  color: string // Para UI (e.g., "blue", "green", "red")
  created_at: string
}

export interface ExamLevel {
  id: string
  teacher_id: string
  name: string
  description: string | null
  created_at: string
}
