"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Exam, Question, AnswerOption, ExamLevel } from "@/lib/types"
import { ArrowLeft, Send, Edit, Trash2, Check, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LatexPreview } from "@/components/latex-preview"
import Link from "next/link"
import { downloadExam } from "@/lib/export-import"

interface ExamWithDetails extends Exam {
  questions?: (Question & { answer_options: AnswerOption[] })[]
}

export default function ExamDetailsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [exam, setExam] = useState<ExamWithDetails | null>(null)
  const [level, setLevel] = useState<ExamLevel | null>(null)
  const [loadingExam, setLoadingExam] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && examId) {
      loadExam()
    }
  }, [user, examId])

  const loadExam = async () => {
    try {
      if (USE_MOCK_DATA) {
        const foundExam = MOCK_DATA.exams.find((e) => e.id === examId)
        if (foundExam) {
          const questions = MOCK_DATA.questions
            .filter((q) => q.exam_id === examId)
            .map((q) => ({
              ...q,
              answer_options: MOCK_DATA.answerOptions.filter(
                (opt) => opt.question_id === q.id
              ),
            }))
          setExam({ ...foundExam, questions })

          if (foundExam.level_id) {
            const foundLevel = MOCK_DATA.levels.find(
              (l) => l.id === foundExam.level_id
            )
            setLevel(foundLevel || null)
          }
        }
      } else {
        const [examData, levelsData] = await Promise.all([
          apiClient.get<ExamWithDetails>(`${API_CONFIG.ENDPOINTS.EXAMS}/${examId}`),
          apiClient.get<ExamLevel[]>(API_CONFIG.ENDPOINTS.LEVELS),
        ])
        setExam(examData)
        if (examData.level_id) {
          const foundLevel = levelsData.find((l) => l.id === examData.level_id)
          setLevel(foundLevel || null)
        }
      }
    } catch (error) {
      console.error("Error loading exam:", error)
    } finally {
      setLoadingExam(false)
    }
  }

  if (loading || loadingExam) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto p-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard/exams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Exámenes
            </Link>
          </Button>
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Examen no encontrado</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalPoints = exam.questions?.reduce((sum, q) => sum + q.points, 0) || 0

  const handleExport = () => {
    if (!exam || !exam.questions) return
    downloadExam(exam, exam.questions)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard/exams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Exámenes
          </Link>
        </Button>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
              {level && <Badge variant="secondary">{level.name}</Badge>}
            </div>
            <p className="mt-2 text-muted-foreground">
              {exam.description || "Sin descripción"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar JSON
            </Button>
            <Button asChild>
              <Link href={`/dashboard/exams/${exam.id}/assign`}>
                <Send className="mr-2 h-4 w-4" />
                Asignar Examen
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exam.duration_minutes || "Sin límite"}{" "}
                {exam.duration_minutes && "min"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Preguntas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exam.questions?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Preguntas</h2>
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      Pregunta {index + 1}
                    </CardTitle>
                    <Badge>{question.points} pts</Badge>
                  </div>
                  <CardDescription>{question.question_text}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {question.question_latex && (
                    <div className="rounded-md border bg-white p-4">
                      <LatexPreview latex={question.question_latex} />
                    </div>
                  )}

                  {question.answer_options && question.answer_options.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Opciones de respuesta:
                      </p>
                      {question.answer_options.map((option, optIndex) => (
                        <div
                          key={option.id}
                          className={`flex items-start gap-2 rounded-md border p-3 ${
                            option.is_correct
                              ? "border-green-500 bg-green-50"
                              : ""
                          }`}
                        >
                          <span className="font-medium">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <div className="flex-1">
                            <span>{option.option_text}</span>
                            {option.option_latex && (
                              <div className="mt-2 rounded-md bg-white p-2">
                                <LatexPreview latex={option.option_latex} />
                              </div>
                            )}
                          </div>
                          {option.is_correct && (
                            <Badge
                              variant="default"
                              className="bg-green-500 gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Correcta
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">
                  Este examen no tiene preguntas
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
