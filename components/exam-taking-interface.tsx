"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import type { ExamEventType, ExamEventSeverity } from "@/lib/types"

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

  // Event tracking refs
  const tabHiddenTimeRef = useRef<number | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const lastAnswerTimeRef = useRef<number>(Date.now())
  const devToolsOpenRef = useRef<boolean>(false)

  // Log event to server
  const logEvent = useCallback(
    async (
      eventType: ExamEventType,
      severity: ExamEventSeverity,
      details: Record<string, unknown> = {}
    ) => {
      try {
        await fetch("/api/exam/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignment_id: assignment.id,
            event_type: eventType,
            severity,
            timestamp: new Date().toISOString(),
            details: {
              ...details,
              question_index: currentQuestion,
            },
          }),
        })
      } catch (error) {
        console.error("[ExamMonitor] Error logging event:", error)
      }
    },
    [assignment.id, currentQuestion]
  )

  // ============================================
  // EVENT MONITORING HOOKS
  // ============================================

  useEffect(() => {
    if (!hasStarted) return

    // --- Tab Visibility Change ---
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabHiddenTimeRef.current = Date.now()
        logEvent("tab_hidden", "warning", { message: "Salió de la pestaña" })
      } else {
        const duration = tabHiddenTimeRef.current
          ? Math.round((Date.now() - tabHiddenTimeRef.current) / 1000)
          : 0
        const severity = duration > 30 ? "critical" : "info"
        logEvent("tab_visible", severity, {
          duration_seconds: duration,
          message: "Volvió a la pestaña",
        })
        tabHiddenTimeRef.current = null
      }
    }

    // --- Window Focus/Blur ---
    const handleWindowBlur = () => {
      logEvent("window_blur", "warning", { message: "La ventana perdió el foco" })
    }

    const handleWindowFocus = () => {
      logEvent("window_focus", "info", { message: "La ventana recuperó el foco" })
    }

    // --- Copy/Cut/Paste Events ---
    const handleCopy = () => {
      logEvent("copy", "warning", { message: "El estudiante copió texto del examen" })
    }

    const handleCut = () => {
      logEvent("cut", "warning", { message: "El estudiante cortó texto" })
    }

    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData("text") || ""
      logEvent("paste", "critical", {
        pasted_length: pastedText.length,
        message: "Pegó texto de fuente externa",
      })
    }

    // --- Right Click (Context Menu) ---
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      logEvent("right_click", "warning", { message: "Intento de abrir menú contextual" })
    }

    // --- Keyboard Shortcuts ---
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect suspicious shortcuts
      const suspiciousShortcuts = [
        { keys: ["Control", "Shift", "I"], name: "Ctrl+Shift+I" },
        { keys: ["Control", "Shift", "J"], name: "Ctrl+Shift+J" },
        { keys: ["Control", "Shift", "C"], name: "Ctrl+Shift+C" },
        { keys: ["Control", "u"], name: "Ctrl+U" },
        { keys: ["F12"], name: "F12" },
        { keys: ["Control", "p"], name: "Ctrl+P" },
      ]

      for (const shortcut of suspiciousShortcuts) {
        const isMatch = shortcut.keys.every((key) => {
          if (key === "Control") return e.ctrlKey
          if (key === "Shift") return e.shiftKey
          if (key === "Alt") return e.altKey
          return e.key === key || e.key.toLowerCase() === key.toLowerCase()
        })

        if (isMatch) {
          e.preventDefault()
          if (shortcut.name === "Ctrl+P") {
            logEvent("print_attempt", "critical", {
              shortcut_keys: shortcut.name,
              message: "Intento de imprimir detectado",
            })
          } else {
            logEvent("keyboard_shortcut", "warning", {
              shortcut_keys: shortcut.name,
              message: "Atajo de teclado sospechoso detectado",
            })
          }
          return
        }
      }
    }

    // --- Print Event ---
    const handleBeforePrint = () => {
      logEvent("print_attempt", "critical", { message: "Intento de imprimir detectado" })
    }

    // --- Fullscreen Change ---
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logEvent("fullscreen_exit", "warning", { message: "Salió del modo pantalla completa" })
      }
    }

    // --- Window Resize (detect split screen / window manipulation) ---
    const handleResize = () => {
      logEvent("browser_resize", "info", {
        window_dimensions: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        message: "Cambio de tamaño de ventana",
      })
    }

    // --- Online/Offline Status ---
    const handleOffline = () => {
      logEvent("connection_lost", "warning", { message: "Se perdió la conexión a internet" })
    }

    const handleOnline = () => {
      logEvent("connection_restored", "info", { message: "Conexión restaurada" })
    }

    // --- DevTools Detection (basic) ---
    const detectDevTools = () => {
      const threshold = 160
      const isOpen =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold

      if (isOpen && !devToolsOpenRef.current) {
        devToolsOpenRef.current = true
        logEvent("devtools_open", "critical", {
          message: "Posible apertura de herramientas de desarrollo",
        })
      } else if (!isOpen) {
        devToolsOpenRef.current = false
      }
    }

    // --- Idle Detection ---
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const idleCheckInterval = setInterval(() => {
      const idleDuration = Math.round((Date.now() - lastActivityRef.current) / 1000)
      if (idleDuration >= 180) {
        logEvent("idle_timeout", "warning", {
          idle_duration_seconds: idleDuration,
          message: "Inactividad prolongada detectada",
        })
        lastActivityRef.current = Date.now() // Reset to avoid repeated logs
      }
    }, 60000) // Check every minute

    const devToolsInterval = setInterval(detectDevTools, 1000)

    // Attach event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)
    window.addEventListener("focus", handleWindowFocus)
    document.addEventListener("copy", handleCopy)
    document.addEventListener("cut", handleCut)
    document.addEventListener("paste", handlePaste)
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("beforeprint", handleBeforePrint)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    window.addEventListener("resize", handleResize)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)
    document.addEventListener("mousemove", handleActivity)
    document.addEventListener("keypress", handleActivity)

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
      window.removeEventListener("focus", handleWindowFocus)
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("cut", handleCut)
      document.removeEventListener("paste", handlePaste)
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("beforeprint", handleBeforePrint)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
      document.removeEventListener("mousemove", handleActivity)
      document.removeEventListener("keypress", handleActivity)
      clearInterval(idleCheckInterval)
      clearInterval(devToolsInterval)
    }
  }, [hasStarted, logEvent])

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
      // Log exam started event
      logEvent("exam_started", "info", { message: "El estudiante inició el examen" })
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
    // Check for rapid answers (less than 5 seconds between answers)
    const timeSinceLastAnswer = Math.round((Date.now() - lastAnswerTimeRef.current) / 1000)
    if (timeSinceLastAnswer < 5 && hasStarted) {
      logEvent("rapid_answers", "warning", {
        answer_time_seconds: timeSinceLastAnswer,
        message: "Respuesta muy rápida (posible adivinanza)",
      })
    }
    lastAnswerTimeRef.current = Date.now()

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

      // Log exam submitted event
      await logEvent("exam_submitted", "info", { message: "Examen enviado correctamente" })

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
