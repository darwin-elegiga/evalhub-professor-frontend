"use client"

import { useAuth } from "@/lib/auth-context"
import { authFetch } from "@/lib/api-client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type {
  Exam,
  ExamAssignment,
  StudentExamAssignment,
  Student,
  StudentGroup,
  Grade,
  FinalGrade,
} from "@/lib/types"

// Final grade labels for 2-5 scale
const FINAL_GRADE_LABELS: Record<FinalGrade, { label: string; color: string; bgColor: string }> = {
  2: { label: "Reprobado", color: "text-red-600", bgColor: "bg-red-50" },
  3: { label: "Aprobado", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  4: { label: "Bueno", color: "text-blue-600", bgColor: "bg-blue-50" },
  5: { label: "Excelente", color: "text-green-600", bgColor: "bg-green-50" },
}
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

interface StudentAssignmentWithDetails {
  assignment: StudentExamAssignment
  student: Student
  grade: Grade | null
}

interface ExamResultsData {
  examAssignment: ExamAssignment
  exam: Exam
  group: StudentGroup | null
  studentAssignments: StudentAssignmentWithDetails[]
  stats: {
    total: number
    submitted: number
    graded: number
    pending: number
    averageScore: number | null
  }
}

export default function ExamResultsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<ExamResultsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && params.id) {
      loadData()
    }
  }, [user, params.id])

  const loadData = async () => {
    try {
      const res = await authFetch(`/api/assignments/${params.id}/results`)
      if (!res.ok) {
        router.push("/dashboard/exams")
        return
      }
      const resultsData = await res.json()

      if (resultsData.error) {
        router.push("/dashboard/exams")
        return
      }

      // Sort student assignments by status
      const sortedAssignments = [...(resultsData.studentAssignments || [])].sort(
        (a: StudentAssignmentWithDetails, b: StudentAssignmentWithDetails) => {
          const statusOrder: Record<string, number> = { submitted: 0, graded: 1, in_progress: 2, pending: 3 }
          return (statusOrder[a.assignment.status] || 3) - (statusOrder[b.assignment.status] || 3)
        }
      )

      // Calculate stats from the response
      const studentAssignments = sortedAssignments as StudentAssignmentWithDetails[]
      const submitted = studentAssignments.filter(
        (sa) =>
          sa.assignment.status === "submitted" ||
          sa.assignment.status === "graded"
      ).length
      const graded = studentAssignments.filter(
        (sa) => sa.assignment.status === "graded"
      ).length
      const pending = studentAssignments.filter(
        (sa) =>
          sa.assignment.status === "pending" ||
          sa.assignment.status === "in_progress"
      ).length

      const gradesWithScores = studentAssignments
        .filter((sa) => sa.grade)
        .map((sa) => sa.grade!.finalGrade)
      const averageScore =
        gradesWithScores.length > 0
          ? gradesWithScores.reduce((a, b) => a + b, 0) / gradesWithScores.length
          : null

      setData({
        examAssignment: resultsData.examAssignment,
        exam: resultsData.exam,
        group: resultsData.group,
        studentAssignments,
        stats: {
          total: studentAssignments.length,
          submitted,
          graded,
          pending,
          averageScore,
        },
      })
    } catch (error) {
      console.error("Error loading exam results:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: StudentExamAssignment["status"]) => {
    switch (status) {
      case "graded":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Calificado
          </Badge>
        )
      case "submitted":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="mr-1 h-3 w-3" />
            Por calificar
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            En progreso
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            Pendiente
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Examen no encontrado</p>
      </div>
    )
  }

  const { examAssignment, exam, group, studentAssignments, stats } = data
  const gradingProgress =
    stats.total > 0 ? Math.round((stats.graded / stats.total) * 100) : 0

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-gray-500 hover:text-gray-700"
          onClick={() => router.push("/dashboard/exams")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a exámenes
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {examAssignment.title}
            </h1>
            {group && (
              <Badge variant="secondary" className="bg-gray-100">
                {group.name}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-gray-500">{exam.title}</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-gray-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </div>
              <div className="text-sm text-gray-500">Estudiantes</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-semibold text-green-600">
                {stats.graded}
              </div>
              <div className="text-sm text-gray-500">Calificados</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-semibold text-amber-600">
                {stats.submitted - stats.graded}
              </div>
              <div className="text-sm text-gray-500">Por calificar</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-semibold text-gray-900">
                {stats.averageScore !== null
                  ? stats.averageScore.toFixed(1)
                  : "—"}
              </div>
              <div className="text-sm text-gray-500">Promedio (2-5)</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="mb-6 border-gray-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progreso de calificación
              </span>
              <span className="text-sm text-gray-500">
                {stats.graded}/{stats.total} ({gradingProgress}%)
              </span>
            </div>
            <Progress
              value={gradingProgress}
              className={`h-2 ${
                gradingProgress === 100
                  ? "[&>div]:bg-green-500"
                  : "[&>div]:bg-primary"
              }`}
            />
          </CardContent>
        </Card>

        {/* Student List */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Resultados por estudiante
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {studentAssignments.map(({ assignment, student, grade }) => (
                <Link
                  key={assignment.id}
                  href={`/dashboard/grades/${assignment.id}`}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 ${
                    assignment.status === "submitted"
                      ? "bg-amber-50/50"
                      : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <User className="h-5 w-5" />
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {student.fullName}
                    </div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </div>

                  {/* Status & Grade */}
                  <div className="flex items-center gap-4">
                    {grade && (
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${FINAL_GRADE_LABELS[grade.finalGrade].color}`}
                        >
                          {grade.finalGrade}
                        </div>
                        <div className={`text-xs ${FINAL_GRADE_LABELS[grade.finalGrade].color}`}>
                          {FINAL_GRADE_LABELS[grade.finalGrade].label}
                        </div>
                      </div>
                    )}
                    {getStatusBadge(assignment.status)}
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
