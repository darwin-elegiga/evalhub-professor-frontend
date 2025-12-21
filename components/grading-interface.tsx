"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import type {
  ExamEvent,
  ExamEventType,
  ExamEventSeverity,
  GradeRoundingMethod,
  FinalGrade,
  Grade,
  StudentAnswer,
} from "@/lib/types"
import type { GradingAssignment, GradingQuestion } from "@/lib/api-types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface GradingInterfaceProps {
  assignment: GradingAssignment
  questions: GradingQuestion[]
  studentAnswers: StudentAnswer[]
  existingGrade: Grade | null
  teacherId: string
  examEvents?: ExamEvent[]
}

// Score labels for 2-5 scale (same as final grade)
const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  2: { label: "Reprobado", color: "text-red-600" },
  3: { label: "Aprobado", color: "text-yellow-600" },
  4: { label: "Bueno", color: "text-blue-600" },
  5: { label: "Excelente", color: "text-green-600" },
}

// Final grade labels for 2-5 scale
const FINAL_GRADE_LABELS: Record<FinalGrade, { label: string; color: string; bgColor: string }> = {
  2: { label: "Reprobado", color: "text-red-700", bgColor: "bg-red-100" },
  3: { label: "Aprobado", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  4: { label: "Bueno", color: "text-blue-700", bgColor: "bg-blue-100" },
  5: { label: "Excelente", color: "text-green-700", bgColor: "bg-green-100" },
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
  const [roundingMethod, setRoundingMethod] = useState<GradeRoundingMethod>(
    existingGrade?.rounding_method || "floor"
  )
  const [scores, setScores] = useState<Record<string, { score: 2 | 3 | 4 | 5; feedback: string }>>(
    studentAnswers.reduce(
      (acc, answer) => ({
        ...acc,
        [answer.question_id]: {
          score: answer.score || 3,
          feedback: answer.feedback || "",
        },
      }),
      {},
    ),
  )

  const getStudentAnswer = (questionId: string) => {
    return studentAnswers.find((a) => a.question_id === questionId)
  }

  const updateScore = (questionId: string, field: "score" | "feedback", value: number | string) => {
    setScores((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }))
  }

  // Calculate average score (2-5 scale)
  const calculateAverageScore = (): number => {
    const scoreValues = Object.values(scores).map((s) => s.score)
    if (scoreValues.length === 0) return 2
    return scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
  }

  // Calculate final grade (2-5 scale) based on average and rounding method
  const calculateFinalGrade = (average: number): FinalGrade => {
    // Apply rounding method: floor rounds down, ceil rounds up
    const rounded = roundingMethod === "ceil" ? Math.ceil(average) : Math.floor(average)

    // Clamp to 2-5 range
    if (rounded <= 2) return 2
    if (rounded >= 5) return 5
    return rounded as FinalGrade
  }

  const averageScore = calculateAverageScore()
  const finalGrade = calculateFinalGrade(averageScore)
  const finalGradeInfo = FINAL_GRADE_LABELS[finalGrade]

  const handleSubmitGrade = async () => {
    setIsLoading(true)

    try {
      // Update student answers with scores and feedback
      for (const questionId of Object.keys(scores)) {
        const answer = getStudentAnswer(questionId)
        if (answer) {
          await fetch(`/api/grades/answer/${answer.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              score: scores[questionId].score,
              feedback: scores[questionId].feedback,
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
          average_score: averageScore,
          final_grade: finalGrade,
          rounding_method: roundingMethod,
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
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Promedio de Preguntas</div>
              <div className="text-2xl font-bold">{averageScore.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Escala 2-5</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Calificación Final</div>
              <div className={`text-3xl font-bold ${finalGradeInfo.color}`}>
                {finalGrade}
              </div>
              <div className={`text-sm font-medium ${finalGradeInfo.color}`}>
                {finalGradeInfo.label}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Estado</div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${finalGradeInfo.bgColor} ${finalGradeInfo.color}`}>
                {finalGrade >= 3 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {finalGrade >= 3 ? "Aprobado" : "Reprobado"}
              </div>
            </div>
          </div>

          {/* Rounding method selector */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Método de Redondeo</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Elige cómo redondear el promedio a la calificación final (2-5)
            </p>
            <RadioGroup
              value={roundingMethod}
              onValueChange={(value) => setRoundingMethod(value as GradeRoundingMethod)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="floor" id="floor" />
                <Label htmlFor="floor" className="cursor-pointer">
                  Por defecto (redondea hacia abajo)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ceil" id="ceil" />
                <Label htmlFor="ceil" className="cursor-pointer">
                  Por exceso (redondea hacia arriba)
                </Label>
              </div>
            </RadioGroup>
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
        {questions.map((question, index) => {
          const studentAnswer = getStudentAnswer(question.id)
          const correctOption = question.answer_options.find((opt) => opt.is_correct)
          const selectedOption = studentAnswer?.selected_option_id
            ? question.answer_options.find((opt) => opt.id === studentAnswer.selected_option_id)
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
                    {question.answer_options.map((option, optIndex) => {
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
                    <Label>Calificación (2-5)</Label>
                    <div className="flex gap-1">
                      {([2, 3, 4, 5] as const).map((value) => {
                        const scoreInfo = SCORE_LABELS[value]
                        const isSelected = scores[question.id]?.score === value
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateScore(question.id, "score", value)}
                            className={`flex-1 py-2 px-3 rounded-md border-2 text-sm font-medium transition-all ${
                              isSelected
                                ? `${scoreInfo.color} border-current bg-opacity-10`
                                : "border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                            style={isSelected ? { backgroundColor: `${scoreInfo.color.replace('text-', '')}10` } : {}}
                            title={scoreInfo.label}
                          >
                            {value}
                          </button>
                        )
                      })}
                    </div>
                    <p className={`text-xs ${SCORE_LABELS[scores[question.id]?.score || 3].color}`}>
                      {SCORE_LABELS[scores[question.id]?.score || 3].label}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`feedback-${question.id}`}>Retroalimentación</Label>
                    <Textarea
                      id={`feedback-${question.id}`}
                      placeholder="Comentarios opcionales..."
                      rows={1}
                      value={scores[question.id]?.feedback || ""}
                      onChange={(e) => updateScore(question.id, "feedback", e.target.value)}
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
