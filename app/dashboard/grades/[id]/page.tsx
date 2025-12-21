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
import type { ExamEvent, StudentAnswer, Grade } from "@/lib/types"
import type { GradingAssignment, GradingQuestion, GradingDataResponse } from "@/lib/api-types"

export default function GradingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  const [assignment, setAssignment] = useState<GradingAssignment | null>(null)
  const [questions, setQuestions] = useState<GradingQuestion[]>([])
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([])
  const [existingGrade, setExistingGrade] = useState<Grade | null>(null)
  const [examEvents, setExamEvents] = useState<ExamEvent[]>([])
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

          setAssignment({
            id: foundAssignment.id,
            status: foundAssignment.status,
            student: {
              full_name: student?.full_name || "Estudiante",
              email: student?.email || "",
            },
            exam: {
              id: exam?.id || "",
              title: exam?.title || "Examen",
              description: exam?.description || "",
            },
          })

          // Get questions with options
          const examQuestions: GradingQuestion[] = MOCK_DATA.questions
            .filter((q) => q.exam_id === foundAssignment.exam_id)
            .map((q) => ({
              ...q,
              answer_options: MOCK_DATA.answerOptions.filter(
                (opt) => opt.question_id === q.id
              ),
            }))
          setQuestions(examQuestions)

          // Get student answers
          const answers = MOCK_DATA.studentAnswers.filter(
            (a) => a.assignment_id === assignmentId
          )
          setStudentAnswers(answers)

          // Get existing grade
          const grade = MOCK_DATA.grades.find(
            (g) => g.assignment_id === assignmentId
          )
          setExistingGrade(grade || null)

          // Get exam events for this assignment
          const events = MOCK_DATA.examEvents.filter(
            (e) => e.assignment_id === assignmentId
          )
          setExamEvents(events)
        }
      } else {
        const data = await apiClient.get<GradingDataResponse>(
          `${API_CONFIG.ENDPOINTS.ASSIGNMENTS}/${assignmentId}/grading`
        )
        setAssignment(data.assignment)
        setQuestions(data.questions)
        setStudentAnswers(data.studentAnswers)
        setExistingGrade(data.existingGrade)
        setExamEvents(data.examEvents || [])
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
        Cargando...
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!assignment) {
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
          assignment={assignment}
          questions={questions}
          studentAnswers={studentAnswers}
          existingGrade={existingGrade}
          teacherId={user.id}
          examEvents={examEvents}
        />
      </div>
    </div>
  )
}
