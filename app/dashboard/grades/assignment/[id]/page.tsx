"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { GradingInterface } from "@/components/grading-interface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { ExamEvent, Grade } from "@/lib/types"
import type { GradingDataResponse, GradingQuestion, GradingAssignment } from "@/lib/api-types"

export default function GradingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  const [gradingData, setGradingData] = useState<GradingDataResponse | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && assignmentId) {
      loadData()
    }
  }, [user, assignmentId])

  const loadData = async () => {
    try {
      if (USE_MOCK_DATA) {
        const foundAssignment = MOCK_DATA.assignments.find(
          (a) => a.id === assignmentId
        )
        if (foundAssignment) {
          const student = MOCK_DATA.students.find(
            (s) => s.id === foundAssignment.student_id
          )
          const exam = MOCK_DATA.exams.find(
            (e) => e.id === foundAssignment.exam_id
          )

          const assignment: GradingAssignment = {
            id: foundAssignment.id,
            status: foundAssignment.status as "pending" | "in_progress" | "submitted" | "graded",
            startedAt: foundAssignment.started_at,
            submittedAt: foundAssignment.submitted_at,
            student: {
              id: student?.id || "",
              fullName: student?.fullName || "Estudiante",
              email: student?.email || "",
              career: student?.career,
            },
            exam: {
              id: exam?.id || "",
              title: exam?.title || "Examen",
              description: exam?.description || null,
            },
          }

          // Get questions with answers
          const questions: GradingQuestion[] = MOCK_DATA.questions
            .filter((q) => q.exam_id === foundAssignment.exam_id)
            .map((q) => {
              const studentAnswer = MOCK_DATA.studentAnswers.find(
                (a) => a.assignment_id === assignmentId && a.question_id === q.id
              )
              return {
                id: q.id,
                title: q.title || `Pregunta ${q.id}`,
                content: q.question_text,
                questionType: q.question_type,
                typeConfig: {},
                weight: q.points || 1,
                answer: studentAnswer ? {
                  id: studentAnswer.id,
                  selectedOptionId: studentAnswer.selected_option_id,
                  answerText: studentAnswer.answer_text,
                  answerNumeric: null,
                  score: studentAnswer.score,
                  feedback: studentAnswer.feedback,
                } : null,
              }
            })

          // Get existing grade
          const grade = MOCK_DATA.grades.find(
            (g) => g.assignment_id === assignmentId
          )
          const existingGrade: Grade | null = grade ? {
            id: grade.id,
            assignmentId: grade.assignment_id,
            averageScore: grade.average_score,
            finalGrade: grade.final_grade,
            roundingMethod: grade.rounding_method,
            gradedAt: grade.graded_at,
            gradedBy: grade.graded_by,
          } : null

          // Get exam events
          const examEvents = MOCK_DATA.examEvents?.filter(
            (e) => e.assignment_id === assignmentId
          ) || []

          setGradingData({
            assignment,
            student: assignment.student,
            exam: assignment.exam,
            questions,
            existingGrade,
            examEvents,
          })
        }
      } else {
        const data = await apiClient.get<GradingDataResponse>(
          API_CONFIG.ENDPOINTS.ASSIGNMENT_GRADING(assignmentId)
        )
        setGradingData(data)
      }
    } catch (error) {
      console.error("Error loading grading data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!gradingData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto p-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard/grades">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Calificaciones
            </Link>
          </Button>
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Asignación no encontrada</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6">
        <GradingInterface
          assignment={gradingData.assignment}
          questions={gradingData.questions}
          existingGrade={gradingData.existingGrade}
          teacherId={user.id}
          examEvents={gradingData.examEvents}
        />
      </div>
    </div>
  )
}
