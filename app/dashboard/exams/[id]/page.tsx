"use client"

import { useAuth } from "@/lib/auth-context"
import { authFetch } from "@/lib/api-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import type { Exam, BankQuestion, Subject, ExamConfig, QuestionType, QuestionDifficulty } from "@/lib/types"
import { ArrowLeft, Send, Download, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { downloadExam } from "@/lib/export-import"

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Opción Múltiple",
  numeric: "Numérica",
  graph_click: "Click en Gráfico",
  image_hotspot: "Zona en Imagen",
  open_text: "Respuesta Abierta",
}

const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
}

const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
}

// Response from GET /exams/:id
interface ExamQuestion {
  id: string
  examId: string
  questionId: string
  questionOrder: number
  weight: number
  question: BankQuestion
}

interface ExamWithDetails extends Exam {
  config?: ExamConfig
  questions?: ExamQuestion[]
}

export default function ExamDetailsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [exam, setExam] = useState<ExamWithDetails | null>(null)
  const [subject, setSubject] = useState<Subject | null>(null)
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
      const examRes = await authFetch(`/api/exams/${examId}`)
      const examData: ExamWithDetails = await examRes.json()
      setExam(examData)

      if (examData.subjectId) {
        try {
          const subjectsRes = await authFetch("/api/subjects")
          const subjectsData: Subject[] = await subjectsRes.json()
          const foundSubject = Array.isArray(subjectsData)
            ? subjectsData.find((s) => s.id === examData.subjectId)
            : null
          setSubject(foundSubject || null)
        } catch {
          // Subject fetch failed, continue without it
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
      <div className="bg-gray-100">
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

  const totalWeight = exam.questions?.reduce((sum, q) => sum + q.weight, 0) || 0

  const handleExport = () => {
    if (!exam || !exam.questions) return
    // Transform to format expected by downloadExam
    const questionsForExport = exam.questions.map((eq) => ({
      ...eq.question,
      weight: eq.weight,
      questionOrder: eq.questionOrder,
    }))
    downloadExam(exam, questionsForExport)
  }

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto p-4 sm:p-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard/exams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Exámenes
          </Link>
        </Button>

        <div className="mb-8 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{exam.title}</h1>
              {subject && <Badge variant="secondary">{subject.name}</Badge>}
            </div>
            <p className="mt-2 text-muted-foreground">
              {exam.description || "Sin descripción"}
            </p>
          </div>
          <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max pb-2">
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
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exam.durationMinutes || "Sin límite"}{" "}
                {exam.durationMinutes && "min"}
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
              <CardTitle className="text-sm font-medium">Peso Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWeight}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Preguntas</h2>
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions
              .sort((a, b) => a.questionOrder - b.questionOrder)
              .map((examQuestion, index) => {
                const question = examQuestion.question

                return (
                  <Link
                    key={examQuestion.id}
                    href={`/dashboard/questions/${question.id}`}
                    className="block"
                  >
                    <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all">
                      <CardHeader className="p-4 sm:p-6">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base sm:text-lg">
                              Pregunta {index + 1}: {question.title}
                            </CardTitle>
                            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              {QUESTION_TYPE_LABELS[question.questionType]}
                            </Badge>
                            <Badge className={DIFFICULTY_COLORS[question.difficulty]}>
                              {DIFFICULTY_LABELS[question.difficulty]}
                            </Badge>
                            <Badge>Peso: {examQuestion.weight}</Badge>
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2 mt-2">
                          <span
                            dangerouslySetInnerHTML={{ __html: question.content }}
                          />
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                )
              })
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
