"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { GradesTable } from "@/components/grades-table"
import type { Grade } from "@/lib/types"

interface AssignmentWithDetails {
  id: string
  status: string
  assigned_at: string
  submitted_at: string | null
  student: {
    full_name: string
    email: string
  }
  exam: {
    id: string
    title: string
  }
  grade: Grade | null
}

export default function GradesPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)

  useEffect(() => {
    if (user) {
      loadAssignments()
    }
  }, [user])

  const loadAssignments = async () => {
    try {
      if (USE_MOCK_DATA) {
        const assignmentsWithDetails: AssignmentWithDetails[] =
          MOCK_DATA.assignments.map((assignment) => {
            const student = MOCK_DATA.students.find(
              (s) => s.id === assignment.student_id
            )
            const exam = MOCK_DATA.exams.find(
              (e) => e.id === assignment.exam_id
            )
            const grade = MOCK_DATA.grades.find(
              (g) => g.assignment_id === assignment.id
            )

            return {
              id: assignment.id,
              status: assignment.status,
              assigned_at: assignment.assigned_at,
              submitted_at: assignment.submitted_at,
              student: {
                full_name: student?.full_name || "Estudiante",
                email: student?.email || "",
              },
              exam: {
                id: exam?.id || "",
                title: exam?.title || "Examen",
              },
              grade: grade || null,
            }
          })
        setAssignments(assignmentsWithDetails)
      } else {
        const data = await apiClient.get<AssignmentWithDetails[]>(
          API_CONFIG.ENDPOINTS.ASSIGNMENTS
        )
        setAssignments(data)
      }
    } catch (error) {
      console.error("Error loading assignments:", error)
    } finally {
      setLoadingAssignments(false)
    }
  }

  if (loadingAssignments) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Cargando calificaciones...
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-gray-500">
            Revisa y califica los exámenes de tus estudiantes
          </p>
        </div>

        <GradesTable assignments={assignments} />
      </div>
    </main>
  )
}
