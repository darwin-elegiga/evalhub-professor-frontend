// Grupo simplificado dentro de Student (solo id y nombre)
export interface StudentGroupRef {
  id: string
  name: string
}

export interface Student {
  id: string
  fullName: string
  email: string
  year: string
  career: string
  createdAt: string
  groups: StudentGroupRef[]
}
