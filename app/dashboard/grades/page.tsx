"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GradesTable } from "@/components/grades-table"
import Link from "next/link"

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
  grade: Array<{
    percentage: number
    points_earned: number
    total_points: number
  }> | null
}

export default function GradesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadAssignments()
    }
  }, [user])

  const loadAssignments = async () => {
    try {
      if (USE_MOCK_DATA) {
        // Build assignments with student and exam details
        const assignmentsWithDetails: AssignmentWithDetails[] = MOCK_DATA.assignments.map(
          (assignment) => {
            const student = MOCK_DATA.students.find(
              (s) => s.id === assignment.student_id
            )
            const exam = MOCK_DATA.exams.find((e) => e.id === assignment.exam_id)
            const grade = MOCK_DATA.grades.filter(
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
              grade: grade.length > 0 ? grade : null,
            }
          }
        )
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

  if (loading || loadingAssignments) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calificaciones</h1>
          <p className="text-muted-foreground">
            Revisa y califica los exámenes de tus estudiantes
          </p>
        </div>

        <GradesTable assignments={assignments} />
      </div>
    </div>
  )
}
