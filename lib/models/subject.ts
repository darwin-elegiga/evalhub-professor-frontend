// Asignatura/Materia (ej: Física, Matemáticas, Química)
export interface Subject {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  updatedAt: string
}

export interface ExamLevel {
  id: string
  teacher_id: string
  name: string
  description: string | null
  created_at: string
}
