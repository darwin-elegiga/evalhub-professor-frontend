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

export default function GradingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  const [assignment, setAssignment] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [studentAnswers, setStudentAnswers] = useState<any[]>([])
  const [existingGrade, setExistingGrade] = useState<any>(null)
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
            ...foundAssignment,
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
          const examQuestions = MOCK_DATA.questions
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
        }
      } else {
        const data = await apiClient.get(
          `${API_CONFIG.ENDPOINTS.ASSIGNMENTS}/${assignmentId}/grading`
        )
        setAssignment(data.assignment)
        setQuestions(data.questions)
        setStudentAnswers(data.studentAnswers)
        setExistingGrade(data.existingGrade)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <GradingInterface
          assignment={assignment}
          questions={questions}
          studentAnswers={studentAnswers}
          existingGrade={existingGrade}
          teacherId={user.id}
        />
      </div>
    </div>
  )
}
