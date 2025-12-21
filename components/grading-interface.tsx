"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ArrowLeft,
  Save,
  Check,
  X,
  Eye,
  EyeOff,
  Copy,
  ClipboardPaste,
  Scissors,
  MousePointer,
  Maximize2,
  Terminal,
  Printer,
  Keyboard,
  Clock,
  Zap,
  Monitor,
  Wifi,
  WifiOff,
  Play,
  Send,
  ChevronDown,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LatexPreview } from "@/components/latex-preview"
import type { ExamEvent, ExamEventType, ExamEventSeverity } from "@/lib/types"

interface GradingInterfaceProps {
  assignment: any
  questions: any[]
  studentAnswers: any[]
  existingGrade: any
  teacherId: string
  examEvents?: ExamEvent[]
}

// Event type configuration
const EVENT_CONFIG: Record<
  ExamEventType,
  { icon: typeof Eye; label: string; description: string }
> = {
  tab_hidden: { icon: EyeOff, label: "Salió de pestaña", description: "El estudiante cambió de pestaña" },
  tab_visible: { icon: Eye, label: "Volvió a pestaña", description: "El estudiante regresó a la pestaña" },
  window_blur: { icon: Monitor, label: "Perdió foco", description: "La ventana perdió el foco" },
  window_focus: { icon: Monitor, label: "Recuperó foco", description: "La ventana recuperó el foco" },
  copy: { icon: Copy, label: "Copió texto", description: "El estudiante copió texto del examen" },
  paste: { icon: ClipboardPaste, label: "Pegó texto", description: "El estudiante pegó texto externo" },
  cut: { icon: Scissors, label: "Cortó texto", description: "El estudiante cortó texto" },
  right_click: { icon: MousePointer, label: "Click derecho", description: "Intento de abrir menú contextual" },
  fullscreen_exit: { icon: Maximize2, label: "Salió fullscreen", description: "Salió del modo pantalla completa" },
  devtools_open: { icon: Terminal, label: "DevTools", description: "Posible apertura de herramientas de desarrollo" },
  screenshot_attempt: { icon: Monitor, label: "Captura", description: "Intento de captura de pantalla" },
  print_attempt: { icon: Printer, label: "Imprimir", description: "Intento de imprimir el examen" },
  keyboard_shortcut: { icon: Keyboard, label: "Atajo teclado", description: "Atajo de teclado sospechoso" },
  idle_timeout: { icon: Clock, label: "Inactividad", description: "Inactividad prolongada detectada" },
  rapid_answers: { icon: Zap, label: "Respuesta rápida", description: "Respuesta muy rápida" },
  browser_resize: { icon: Monitor, label: "Resize", description: "Cambio de tamaño de ventana" },
  connection_lost: { icon: WifiOff, label: "Sin conexión", description: "Se perdió la conexión" },
  connection_restored: { icon: Wifi, label: "Conexión OK", description: "Conexión restaurada" },
  exam_started: { icon: Play, label: "Inicio", description: "El estudiante inició el examen" },
  exam_submitted: { icon: Send, label: "Enviado", description: "El estudiante envió el examen" },
}

const SEVERITY_CONFIG: Record<
  ExamEventSeverity,
  { color: string; bgColor: string; icon: typeof Info }
> = {
  info: { color: "text-blue-600", bgColor: "bg-blue-50", icon: Info },
  warning: { color: "text-amber-600", bgColor: "bg-amber-50", icon: AlertTriangle },
  critical: { color: "text-red-600", bgColor: "bg-red-50", icon: AlertCircle },
}

export function GradingInterface({
  assignment,
  questions,
  studentAnswers,
  existingGrade,
  teacherId,
  examEvents = [],
}: GradingInterfaceProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [eventsOpen, setEventsOpen] = useState(false)
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

      {/* Exam Events / Activity Log */}
      {examEvents.length > 0 && (
        <Card className="border-gray-200">
          <Collapsible open={eventsOpen} onOpenChange={setEventsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base font-medium">
                      Registro de Actividad
                    </CardTitle>
                    {/* Event summary badges */}
                    <div className="flex gap-1.5">
                      {(() => {
                        const criticalCount = examEvents.filter(e => e.severity === "critical").length
                        const warningCount = examEvents.filter(e => e.severity === "warning").length
                        return (
                          <>
                            {criticalCount > 0 && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {criticalCount}
                              </Badge>
                            )}
                            {warningCount > 0 && (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {warningCount}
                              </Badge>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      eventsOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <CardDescription>
                  {examEvents.length} eventos registrados durante el examen
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {examEvents
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((event) => {
                      const config = EVENT_CONFIG[event.event_type]
                      const severityConfig = SEVERITY_CONFIG[event.severity]
                      const EventIcon = config.icon
                      const SeverityIcon = severityConfig.icon

                      return (
                        <div
                          key={event.id}
                          className={`flex items-start gap-3 rounded-lg border p-3 ${severityConfig.bgColor}`}
                        >
                          {/* Event Icon */}
                          <div className={`mt-0.5 ${severityConfig.color}`}>
                            <EventIcon className="h-4 w-4" />
                          </div>

                          {/* Event Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${severityConfig.color}`}>
                                {config.label}
                              </span>
                              {event.severity !== "info" && (
                                <SeverityIcon className={`h-3.5 w-3.5 ${severityConfig.color}`} />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {event.details.message || config.description}
                            </p>
                            {/* Additional details */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                              {event.details.duration_seconds !== undefined && (
                                <span>Duración: {event.details.duration_seconds}s</span>
                              )}
                              {event.details.pasted_length !== undefined && (
                                <span>Caracteres pegados: {event.details.pasted_length}</span>
                              )}
                              {event.details.shortcut_keys && (
                                <span>Teclas: {event.details.shortcut_keys}</span>
                              )}
                              {event.details.idle_duration_seconds !== undefined && (
                                <span>Inactivo: {event.details.idle_duration_seconds}s</span>
                              )}
                              {event.details.answer_time_seconds !== undefined && (
                                <span>Tiempo respuesta: {event.details.answer_time_seconds}s</span>
                              )}
                              {event.details.question_index !== undefined && (
                                <span>Pregunta: {event.details.question_index + 1}</span>
                              )}
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="text-xs text-gray-400 shrink-0">
                            {new Date(event.timestamp).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

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
