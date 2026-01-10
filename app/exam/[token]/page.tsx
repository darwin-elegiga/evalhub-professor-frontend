"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { ExamTakingInterface } from "@/components/exam-taking-interface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import type { StudentAnswer } from "@/lib/types"
import type { ExamTakingAssignment, ExamQuestion, ExamTokenResponse } from "@/lib/api-types"

export default function ExamPage() {
  const params = useParams()
  const token = params.token as string

  const [assignment, setAssignment] = useState<ExamTakingAssignment | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [existingAnswers, setExistingAnswers] = useState<StudentAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadExamData()
    }
  }, [token])

  const loadExamData = async () => {
    try {
        const data = await apiClient.get<ExamTokenResponse>(
          API_CONFIG.ENDPOINTS.ASSIGNMENT_BY_TOKEN(token)
        )
        setAssignment(data.assignment)
        setQuestions(data.questions)
        setExistingAnswers(data.existingAnswers || [])
    } catch (error) {
      console.error("Error loading exam:", error)
      setError("Error al cargar el examen")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Cargando examen...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por favor, contacta a tu profesor para obtener un enlace válido.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Examen no encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show completion message if exam is already submitted or graded
  if (assignment.status === "submitted" || assignment.status === "graded") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Examen Completado</CardTitle>
            <CardDescription>
              Has completado el examen &quot;{assignment.exam.title}&quot;
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant={assignment.status === "graded" ? "default" : "secondary"}>
                    {assignment.status === "graded" ? "Calificado" : "Entregado"}
                  </Badge>
                </div>
                {assignment.submittedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de entrega:</span>
                    <span className="font-medium">
                      {new Date(assignment.submittedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Tu profesor revisará tu examen y te notificará de tu calificación.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ExamTakingInterface
        assignment={assignment}
        questions={questions}
        existingAnswers={existingAnswers}
      />
    </div>
  )
}
