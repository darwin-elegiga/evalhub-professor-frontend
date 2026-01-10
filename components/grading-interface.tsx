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
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type {
  ExamEvent,
  ExamEventType,
  ExamEventSeverity,
  GradeRoundingMethod,
  FinalGrade,
  Grade,
} from "@/lib/types"
import type { GradingAssignment, GradingQuestion } from "@/lib/api-types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface GradingInterfaceProps {
  assignment: GradingAssignment
  questions: GradingQuestion[]
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

// Question type labels
const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Opción Múltiple",
  numeric: "Numérica",
  graph_click: "Click en Gráfico",
  open_text: "Respuesta Abierta",
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
  existingGrade,
  teacherId,
  examEvents = [],
}: GradingInterfaceProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null)
  const [eventsOpen, setEventsOpen] = useState(false)
  const [roundingMethod, setRoundingMethod] = useState<GradeRoundingMethod>(
    existingGrade?.roundingMethod || "floor"
  )

  // Initialize scores from questions with embedded answers
  const [scores, setScores] = useState<Record<string, { score: 2 | 3 | 4 | 5; feedback: string }>>(
    questions.reduce(
      (acc, question) => ({
        ...acc,
        [question.id]: {
          score: (question.answer?.score as 2 | 3 | 4 | 5) || 3,
          feedback: question.answer?.feedback || "",
        },
      }),
      {},
    ),
  )

  const updateScore = (questionId: string, field: "score" | "feedback", value: number | string) => {
    setScores((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }))
  }

  // Calculate weighted average score (2-5 scale)
  const calculateAverageScore = (): number => {
    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0)
    if (totalWeight === 0) return 2

    const weightedSum = questions.reduce((sum, q) => {
      const score = scores[q.id]?.score || 2
      return sum + score * q.weight
    }, 0)

    return weightedSum / totalWeight
  }

  // Calculate final grade (2-5 scale) based on average and rounding method
  const calculateFinalGrade = (average: number): FinalGrade => {
    let rounded: number
    switch (roundingMethod) {
      case "ceil":
        rounded = Math.ceil(average)
        break
      case "round":
        rounded = Math.round(average)
        break
      case "floor":
      default:
        rounded = Math.floor(average)
        break
    }

    // Clamp to 2-5 range
    if (rounded <= 2) return 2
    if (rounded >= 5) return 5
    return rounded as FinalGrade
  }

  const averageScore = calculateAverageScore()
  const finalGrade = calculateFinalGrade(averageScore)
  const finalGradeInfo = FINAL_GRADE_LABELS[finalGrade]

  // Save individual answer grade
  const saveAnswerGrade = async (questionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (!question?.answer) return

    setSavingAnswerId(question.answer.id)

    try {
      await apiClient.put(
        API_CONFIG.ENDPOINTS.GRADE_ANSWER(question.answer.id),
        {
          score: scores[questionId].score,
          feedback: scores[questionId].feedback || null,
        }
      )
      toast.success("Calificación guardada")
    } catch (error) {
      console.error("Error saving answer grade:", error)
      toast.error("Error al guardar la calificación")
    } finally {
      setSavingAnswerId(null)
    }
  }

  // Submit final grade
  const handleSubmitGrade = async () => {
    setIsLoading(true)

    try {
      // First, save all individual answer grades
      for (const question of questions) {
        if (question.answer) {
          await apiClient.put(
            API_CONFIG.ENDPOINTS.GRADE_ANSWER(question.answer.id),
            {
              score: scores[question.id].score,
              feedback: scores[question.id].feedback || null,
            }
          )
        }
      }

      // Then submit the final grade
      await apiClient.post(API_CONFIG.ENDPOINTS.GRADES_SUBMIT, {
        assignmentId: assignment.id,
        averageScore: averageScore,
        finalGrade: finalGrade,
        roundingMethod: roundingMethod,
      })

      toast.success("Calificación final enviada")
      router.push("/dashboard/grades")
      router.refresh()
    } catch (error) {
      console.error("Error submitting grade:", error)
      toast.error("Error al enviar la calificación")
    } finally {
      setIsLoading(false)
    }
  }

  // Render answer based on question type
  const renderAnswer = (question: GradingQuestion) => {
    const answer = question.answer
    if (!answer) {
      return (
        <div className="rounded-md border border-dashed bg-gray-50 p-4 text-center text-gray-500">
          Sin respuesta
        </div>
      )
    }

    const typeConfig = question.typeConfig as Record<string, unknown>

    switch (question.questionType) {
      case "multiple_choice": {
        const options = (typeConfig.options || []) as Array<{
          id: string
          text: string
          isCorrect?: boolean
        }>
        const selectedId = answer.selectedOptionId

        return (
          <div className="space-y-2">
            {options.map((option, idx) => {
              const isSelected = option.id === selectedId
              const isCorrect = option.isCorrect

              return (
                <div
                  key={option.id}
                  className={`rounded-md border p-3 ${
                    isSelected && isCorrect
                      ? "border-green-500 bg-green-50"
                      : isSelected
                        ? "border-red-500 bg-red-50"
                        : isCorrect
                          ? "border-green-300 bg-green-50/50"
                          : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className="flex-1">{option.text}</span>
                    {isSelected && (
                      <Badge variant="secondary" className="shrink-0">
                        Seleccionada
                      </Badge>
                    )}
                    {isCorrect && (
                      <Badge className="shrink-0 bg-green-600">
                        Correcta
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      case "numeric": {
        const correctAnswer = typeConfig.correctAnswer as number | undefined
        const tolerance = typeConfig.tolerance as number | undefined
        const studentAnswer = answer.answerNumeric

        const isCorrect = correctAnswer !== undefined && studentAnswer !== undefined
          ? Math.abs(studentAnswer - correctAnswer) <= (tolerance || 0)
          : false

        return (
          <div className="space-y-3">
            <div className={`rounded-md border p-4 ${isCorrect ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
              <div className="text-sm text-gray-500 mb-1">Respuesta del estudiante:</div>
              <div className="text-lg font-mono font-semibold">
                {studentAnswer !== null ? studentAnswer : "Sin respuesta"}
              </div>
            </div>
            {correctAnswer !== undefined && (
              <div className="text-sm text-gray-600">
                Respuesta correcta: <span className="font-semibold">{correctAnswer}</span>
                {tolerance !== undefined && tolerance > 0 && (
                  <span className="text-gray-400"> (tolerancia: ±{tolerance})</span>
                )}
              </div>
            )}
          </div>
        )
      }

      case "open_text":
        return (
          <div className="rounded-md border bg-gray-50 p-4">
            <div className="text-sm text-gray-500 mb-2">Respuesta del estudiante:</div>
            <div className="whitespace-pre-wrap text-gray-800">
              {answer.answerText || "Sin respuesta"}
            </div>
          </div>
        )

      default:
        return (
          <div className="rounded-md border bg-gray-50 p-4 text-gray-600">
            Tipo de pregunta no soportado para visualización
          </div>
        )
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
            <p className="text-muted-foreground">Estudiante: {assignment.student.fullName}</p>
          </div>
          <Badge
            variant={assignment.status === "graded" ? "default" : "secondary"}
            className={assignment.status === "graded" ? "bg-green-600" : "bg-amber-500"}
          >
            {assignment.status === "graded" ? "Calificado" : "Por Calificar"}
          </Badge>
        </div>
      </div>

      {/* Grade Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Calificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Promedio Ponderado</div>
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
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="floor" id="floor" />
                <Label htmlFor="floor" className="cursor-pointer">
                  Por defecto (hacia abajo)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="round" id="round" />
                <Label htmlFor="round" className="cursor-pointer">
                  Redondeo estándar
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ceil" id="ceil" />
                <Label htmlFor="ceil" className="cursor-pointer">
                  Por exceso (hacia arriba)
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
                      const EventIcon = config?.icon || Info
                      const SeverityIcon = severityConfig?.icon || Info

                      return (
                        <div
                          key={event.id}
                          className={`flex items-start gap-3 rounded-lg border p-3 ${severityConfig?.bgColor || "bg-gray-50"}`}
                        >
                          {/* Event Icon */}
                          <div className={`mt-0.5 ${severityConfig?.color || "text-gray-600"}`}>
                            <EventIcon className="h-4 w-4" />
                          </div>

                          {/* Event Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${severityConfig?.color || "text-gray-600"}`}>
                                {config?.label || event.event_type}
                              </span>
                              {event.severity !== "info" && (
                                <SeverityIcon className={`h-3.5 w-3.5 ${severityConfig?.color || ""}`} />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {event.details?.message || config?.description || ""}
                            </p>
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

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const isSaving = savingAnswerId === question.answer?.id

          return (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Pregunta {index + 1}: {question.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {QUESTION_TYPE_LABELS[question.questionType] || question.questionType}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Peso: {question.weight}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  <span dangerouslySetInnerHTML={{ __html: question.content }} />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Student Answer */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Respuesta del Estudiante</Label>
                  {renderAnswer(question)}
                </div>

                {/* Grading Section */}
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
                                ? `${scoreInfo.color} border-current`
                                : "border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
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
                      rows={2}
                      value={scores[question.id]?.feedback || ""}
                      onChange={(e) => updateScore(question.id, "feedback", e.target.value)}
                    />
                  </div>
                </div>

                {/* Save individual answer button */}
                {question.answer && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveAnswerGrade(question.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {isSaving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Submit Grade */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button onClick={handleSubmitGrade} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Enviando..." : "Enviar Calificación Final"}
        </Button>
      </div>
    </div>
  )
}
