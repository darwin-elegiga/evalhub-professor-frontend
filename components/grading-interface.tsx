"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Check, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LatexPreview } from "@/components/latex-preview"

interface GradingInterfaceProps {
  assignment: any
  questions: any[]
  studentAnswers: any[]
  existingGrade: any
  teacherId: string
}

export function GradingInterface({
  assignment,
  questions,
  studentAnswers,
  existingGrade,
  teacherId,
}: GradingInterfaceProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [grades, setGrades] = useState<Record<string, { points: number; feedback: string }>>(
    studentAnswers.reduce(
      (acc, answer) => ({
        ...acc,
        [answer.question_id]: {
          points: answer.points_earned || 0,
          feedback: answer.feedback || "",
        },
      }),
      {},
    ),
  )

  const getStudentAnswer = (questionId: string) => {
    return studentAnswers.find((a) => a.question_id === questionId)
  }

  const updateGrade = (questionId: string, field: "points" | "feedback", value: number | string) => {
    setGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }))
  }

  const calculateTotal = () => {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
    const earnedPoints = Object.values(grades).reduce((sum, g) => sum + g.points, 0)
    return { totalPoints, earnedPoints }
  }

  const handleSubmitGrade = async () => {
    setIsLoading(true)

    try {
      const { totalPoints, earnedPoints } = calculateTotal()

      // Update student answers with grades and feedback
      for (const questionId of Object.keys(grades)) {
        const answer = getStudentAnswer(questionId)
        if (answer) {
          await fetch(`/api/grades/answer/${answer.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              points_earned: grades[questionId].points,
              feedback: grades[questionId].feedback,
            }),
          })
        }
      }

      // Create or update grade
      const response = await fetch("/api/grades/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignment.id,
          total_points: totalPoints,
          points_earned: earnedPoints,
          graded_by: teacherId,
        }),
      })

      if (!response.ok) throw new Error("Error submitting grade")

      router.push("/dashboard/grades")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error submitting grade:", error)
      alert("Error al guardar la calificación")
    } finally {
      setIsLoading(false)
    }
  }

  const { totalPoints, earnedPoints } = calculateTotal()
  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard/grades">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Calificaciones
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{assignment.exam.title}</h1>
            <p className="text-muted-foreground">Estudiante: {assignment.student.full_name}</p>
          </div>
          <Badge variant={assignment.status === "graded" ? "default" : "secondary"} className="bg-blue-500">
            {assignment.status === "graded" ? "Calificado" : "Por Calificar"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Calificación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-muted-foreground">Puntos Obtenidos</div>
            <div className="text-2xl font-bold">
              {earnedPoints.toFixed(1)} / {totalPoints.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Porcentaje</div>
            <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Estado</div>
            <div className="text-2xl font-bold">
              {percentage >= 70 ? (
                <span className="text-green-600">Aprobado</span>
              ) : (
                <span className="text-red-600">Reprobado</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((question: any, index: number) => {
          const studentAnswer = getStudentAnswer(question.id)
          const correctOption = question.answer_options.find((opt: any) => opt.is_correct)
          const selectedOption = studentAnswer?.selected_option_id
            ? question.answer_options.find((opt: any) => opt.id === studentAnswer.selected_option_id)
            : null
          const isCorrect = selectedOption?.is_correct || false

          return (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Pregunta {index + 1} ({question.points} pts)
                  </CardTitle>
                  {studentAnswer && (
                    <Badge variant={isCorrect ? "default" : "destructive"} className="gap-1">
                      {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {isCorrect ? "Correcta" : "Incorrecta"}
                    </Badge>
                  )}
                </div>
                <CardDescription>{question.question_text}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {question.question_latex && (
                  <div className="rounded-md border bg-white p-4">
                    <LatexPreview latex={question.question_latex} />
                  </div>
                )}

                {question.answer_options.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Opciones:</Label>
                    {question.answer_options.map((option: any, optIndex: number) => {
                      const isSelected = option.id === studentAnswer?.selected_option_id
                      const isCorrectAnswer = option.is_correct

                      return (
                        <div
                          key={option.id}
                          className={`rounded-md border p-3 ${
                            isSelected && isCorrectAnswer
                              ? "border-green-500 bg-green-50"
                              : isSelected
                                ? "border-red-500 bg-red-50"
                                : isCorrectAnswer
                                  ? "border-green-300 bg-green-50"
                                  : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                            <div className="flex-1">
                              {option.option_text}
                              {option.option_latex && (
                                <div className="mt-2 rounded-md bg-white p-2">
                                  <LatexPreview latex={option.option_latex} />
                                </div>
                              )}
                            </div>
                            {isSelected && <Badge variant="secondary">Seleccionada</Badge>}
                            {isCorrectAnswer && <Badge variant="default">Correcta</Badge>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {studentAnswer?.answer_text && (
                  <div>
                    <Label className="text-sm font-medium">Respuesta del Estudiante:</Label>
                    <div className="mt-2 rounded-md border bg-gray-50 p-3">{studentAnswer.answer_text}</div>
                  </div>
                )}

                <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`points-${question.id}`}>Puntos Asignados</Label>
                    <Input
                      id={`points-${question.id}`}
                      type="number"
                      min="0"
                      max={question.points}
                      step="0.5"
                      value={grades[question.id]?.points || 0}
                      onChange={(e) => updateGrade(question.id, "points", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`feedback-${question.id}`}>Retroalimentación</Label>
                    <Textarea
                      id={`feedback-${question.id}`}
                      placeholder="Comentarios opcionales..."
                      rows={1}
                      value={grades[question.id]?.feedback || ""}
                      onChange={(e) => updateGrade(question.id, "feedback", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button onClick={handleSubmitGrade} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Guardando..." : "Guardar Calificación"}
        </Button>
      </div>
    </div>
  )
}
