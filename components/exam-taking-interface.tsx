"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Clock, Send, AlertCircle } from "lucide-react"
import { LatexPreview } from "@/components/latex-preview"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ExamTakingInterfaceProps {
  assignment: any
  questions: any[]
  existingAnswers: any[]
}

export function ExamTakingInterface({ assignment, questions, existingAnswers }: ExamTakingInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string; answer_text?: string }>>(
    existingAnswers.reduce(
      (acc, answer) => ({
        ...acc,
        [answer.question_id]: {
          selected_option_id: answer.selected_option_id,
          answer_text: answer.answer_text,
        },
      }),
      {},
    ),
  )
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    assignment.exam.duration_minutes ? assignment.exam.duration_minutes * 60 : null,
  )
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasStarted, setHasStarted] = useState(assignment.status === "in_progress")

  useEffect(() => {
    if (!hasStarted || timeRemaining === null) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [hasStarted, timeRemaining])

  const handleStart = async () => {
    try {
      await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment_id: assignment.id }),
      })
      setHasStarted(true)
    } catch (error) {
      console.error("[v0] Error starting exam:", error)
      alert("Error al iniciar el examen")
    }
  }

  const updateAnswer = (questionId: string, field: "selected_option_id" | "answer_text", value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }))
  }

  const saveAnswer = async (questionId: string) => {
    try {
      await fetch("/api/exam/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignment.id,
          question_id: questionId,
          selected_option_id: answers[questionId]?.selected_option_id || null,
          answer_text: answers[questionId]?.answer_text || null,
        }),
      })
    } catch (error) {
      console.error("[v0] Error saving answer:", error)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Save all answers
      for (const questionId of Object.keys(answers)) {
        await saveAnswer(questionId)
      }

      // Submit exam
      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment_id: assignment.id }),
      })

      if (!response.ok) throw new Error("Error submitting exam")

      window.location.reload()
    } catch (error) {
      console.error("[v0] Error submitting exam:", error)
      alert("Error al enviar el examen")
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100
  const answeredQuestions = Object.keys(answers).length

  if (!hasStarted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{assignment.exam.title}</CardTitle>
            <CardDescription>{assignment.exam.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-4 font-semibold">Información del Examen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estudiante:</span>
                  <span className="font-medium">{assignment.student.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Número de preguntas:</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                {assignment.exam.duration_minutes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración:</span>
                    <span className="font-medium">{assignment.exam.duration_minutes} minutos</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="text-sm text-orange-800">
                <p className="font-semibold">Instrucciones:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Lee cada pregunta cuidadosamente</li>
                  <li>Tus respuestas se guardan automáticamente</li>
                  <li>Puedes navegar entre preguntas usando los botones</li>
                  {assignment.exam.duration_minutes && (
                    <li>El examen se enviará automáticamente al terminar el tiempo</li>
                  )}
                  <li>Asegúrate de enviar el examen al finalizar</li>
                </ul>
              </div>
            </div>

            <Button onClick={handleStart} className="w-full" size="lg">
              Comenzar Examen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{assignment.exam.title}</h1>
          <p className="text-sm text-muted-foreground">Estudiante: {assignment.student.full_name}</p>
        </div>
        {timeRemaining !== null && (
          <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-semibold">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Pregunta {currentQuestion + 1} de {questions.length}
          </span>
          <span className="text-muted-foreground">
            Respondidas: {answeredQuestions} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            Pregunta {currentQuestion + 1} ({question.points} puntos)
          </CardTitle>
          <CardDescription>{question.question_text}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {question.question_latex && (
            <div className="rounded-md border bg-white p-4">
              <LatexPreview latex={question.question_latex} />
            </div>
          )}

          {question.question_image_url && (
            <div className="rounded-md border">
              <img src={question.question_image_url || "/placeholder.svg"} alt="Question" className="w-full" />
            </div>
          )}

          {question.answer_options && question.answer_options.length > 0 ? (
            <RadioGroup
              value={answers[question.id]?.selected_option_id || ""}
              onValueChange={(value) => {
                updateAnswer(question.id, "selected_option_id", value)
                saveAnswer(question.id)
              }}
            >
              <div className="space-y-3">
                {question.answer_options.map((option: any, index: number) => (
                  <div key={option.id} className="flex items-start space-x-3 rounded-md border p-4 hover:bg-gray-50">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">
                        {String.fromCharCode(65 + index)}. {option.option_text}
                      </div>
                      {option.option_latex && (
                        <div className="mt-2 rounded-md bg-gray-50 p-2">
                          <LatexPreview latex={option.option_latex} />
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="answer-text">Tu respuesta:</Label>
              <Textarea
                id="answer-text"
                placeholder="Escribe tu respuesta aquí..."
                rows={5}
                value={answers[question.id]?.answer_text || ""}
                onChange={(e) => updateAnswer(question.id, "answer_text", e.target.value)}
                onBlur={() => saveAnswer(question.id)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          Anterior
        </Button>

        <div className="flex gap-2">
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion((prev) => prev + 1)}>Siguiente</Button>
          ) : (
            <Button onClick={() => setShowSubmitDialog(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Enviar Examen
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar examen?</AlertDialogTitle>
            <AlertDialogDescription>
              Has respondido {answeredQuestions} de {questions.length} preguntas. Una vez enviado el examen, no podrás
              modificar tus respuestas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
