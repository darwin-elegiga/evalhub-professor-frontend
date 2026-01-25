"use client"

import { useAuth } from "@/lib/auth-context"
import { authFetch } from "@/lib/api-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import type { Subject, QuestionTopic, BankQuestion, QuestionType, QuestionDifficulty } from "@/lib/types"
import { ArrowLeft, Edit, Clock, Scale, CheckCircle2, XCircle, Info } from "lucide-react"
import { GraphViewer, type GraphConfig } from "@/components/graph-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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

const SUBJECT_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
  pink: "bg-pink-100 text-pink-800",
  cyan: "bg-cyan-100 text-cyan-800",
  yellow: "bg-yellow-100 text-yellow-800",
  indigo: "bg-indigo-100 text-indigo-800",
  teal: "bg-teal-100 text-teal-800",
}

export default function QuestionDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const questionId = params.id as string

  const [question, setQuestion] = useState<BankQuestion | null>(null)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [topic, setTopic] = useState<QuestionTopic | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && questionId) {
      loadData()
    }
  }, [user, questionId])

  const loadData = async () => {
    try {
      let questionData: BankQuestion | null = null
      let subjectData: Subject | null = null
      let topicData: QuestionTopic | null = null

      const qRes = await authFetch(`/api/questions/${questionId}`)
      questionData = await qRes.json()

      if (questionData?.subjectId) {
        const subjectsRes = await authFetch("/api/subjects")
        const subjects: Subject[] = await subjectsRes.json()
        subjectData = Array.isArray(subjects)
          ? subjects.find((s) => s.id === questionData?.subjectId) || null
          : null
      }
      if (questionData?.topicId) {
        const topicsRes = await authFetch("/api/topics")
        const topics: QuestionTopic[] = await topicsRes.json()
        topicData = Array.isArray(topics)
          ? topics.find((t) => t.id === questionData?.topicId) || null
          : null
      }

      setQuestion(questionData)
      setSubject(subjectData)
      setTopic(topicData)
    } catch (error) {
      console.error("Error loading question:", error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando pregunta...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pregunta no encontrada</h2>
          <p className="text-muted-foreground mb-4">La pregunta que buscas no existe o fue eliminada.</p>
          <Button asChild>
            <Link href="/dashboard/questions">Volver al banco de preguntas</Link>
          </Button>
        </div>
      </div>
    )
  }

  const renderMultipleChoiceOptions = () => {
    const config = question.typeConfig as any
    if (!config?.options) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Opciones de respuesta:</h4>
        {config.options.map((option: any, index: number) => (
          <div
            key={option.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              option.isCorrect ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"
            }`}
          >
            {option.isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: option.text }}
              />
            </div>
          </div>
        ))}
        <div className="flex gap-4 text-sm text-muted-foreground mt-4">
          {config.allowMultiple && (
            <span className="flex items-center gap-1">
              <Badge variant="outline">Múltiples respuestas permitidas</Badge>
            </span>
          )}
          {config.shuffleOptions && (
            <span className="flex items-center gap-1">
              <Badge variant="outline">Opciones mezcladas</Badge>
            </span>
          )}
        </div>
      </div>
    )
  }

  const renderNumericConfig = () => {
    const config = question.typeConfig as any
    if (!config) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Configuración numérica:</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">Valor correcto</p>
            <p className="text-2xl font-semibold text-gray-900">
              {config.correctValue}
              {config.unit && <span className="text-base ml-1">{config.unit}</span>}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">Tolerancia</p>
            <p className="text-2xl font-semibold text-gray-900">
              ±{config.tolerance}
              {config.toleranceType === "percentage" ? "%" : ""}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {config.toleranceType === "percentage"
            ? `Se aceptarán valores entre ${(config.correctValue * (1 - config.tolerance / 100)).toFixed(2)} y ${(config.correctValue * (1 + config.tolerance / 100)).toFixed(2)}`
            : `Se aceptarán valores entre ${config.correctValue - config.tolerance} y ${config.correctValue + config.tolerance}`}
        </p>
      </div>
    )
  }

  const renderOpenTextConfig = () => {
    return (
      <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-700">
          <strong>Respuesta abierta:</strong> Los estudiantes escribirán una respuesta libre.
          Esta pregunta requiere calificación manual.
        </p>
      </div>
    )
  }

  const renderGraphConfig = () => {
    const config = question.typeConfig as any
    if (!config) return null

    // Build GraphConfig from typeConfig
    const graphConfig: GraphConfig = {
      xRange: config.xRange || [-10, 10],
      yRange: config.yRange || [-10, 10],
      xLabel: config.xLabel || "x",
      yLabel: config.yLabel || "y",
      title: config.title,
      showGrid: config.showGrid !== false,
      gridStep: config.gridStep || 1,
      lines: config.lines || [],
      functions: config.functions || [],
      correctPoint: config.correctPoint,
      toleranceRadius: config.toleranceRadius || 0.5,
      isInteractive: config.isInteractive || false,
      answerType: config.answerType,
      correctFunctionId: config.correctFunctionId,
      correctArea: config.correctArea,
    }

    // Find the correct function if answerType is "function"
    const correctFunction = graphConfig.answerType === "function" && graphConfig.correctFunctionId
      ? graphConfig.functions?.find(f => f.id === graphConfig.correctFunctionId)
      : null

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Visualización del gráfico:</h4>

        {/* Render the actual graph */}
        <div className="flex justify-center">
          <GraphViewer config={graphConfig} />
        </div>

        {/* Graph metadata */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h5 className="font-medium text-gray-700 mb-2">Ejes</h5>
            <div className="grid gap-1 text-sm">
              <p><span className="text-gray-500">Rango X:</span> [{graphConfig.xRange[0]}, {graphConfig.xRange[1]}]</p>
              <p><span className="text-gray-500">Rango Y:</span> [{graphConfig.yRange[0]}, {graphConfig.yRange[1]}]</p>
              <p><span className="text-gray-500">Etiqueta X:</span> {graphConfig.xLabel}</p>
              <p><span className="text-gray-500">Etiqueta Y:</span> {graphConfig.yLabel}</p>
            </div>
          </div>

          {/* Answer info based on answerType */}
          {graphConfig.isInteractive && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50">
              <h5 className="font-medium text-green-700 mb-2">Respuesta correcta</h5>
              <div className="grid gap-1 text-sm">
                {/* Point answer */}
                {(graphConfig.answerType === "point" || (!graphConfig.answerType && graphConfig.correctPoint)) && graphConfig.correctPoint && (
                  <>
                    <p><span className="text-green-600">Tipo:</span> Punto</p>
                    <p><span className="text-green-600">Coordenadas:</span> ({graphConfig.correctPoint.x}, {graphConfig.correctPoint.y})</p>
                    <p><span className="text-green-600">Radio de tolerancia:</span> {graphConfig.toleranceRadius} unidades</p>
                  </>
                )}

                {/* Function answer */}
                {graphConfig.answerType === "function" && correctFunction && (
                  <>
                    <p><span className="text-green-600">Tipo:</span> Función</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: correctFunction.color }}
                      />
                      <span className="font-mono">y = {correctFunction.expression}</span>
                    </div>
                  </>
                )}

                {/* Area answer */}
                {graphConfig.answerType === "area" && graphConfig.correctArea && (
                  <>
                    <p><span className="text-green-600">Tipo:</span> Área</p>
                    <p><span className="text-green-600">Desde:</span> ({graphConfig.correctArea.x1}, {graphConfig.correctArea.y1})</p>
                    <p><span className="text-green-600">Hasta:</span> ({graphConfig.correctArea.x2}, {graphConfig.correctArea.y2})</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Functions list */}
        {graphConfig.functions && graphConfig.functions.length > 0 && (
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
            <h5 className="font-medium text-blue-700 mb-2">Funciones graficadas</h5>
            <div className="space-y-2">
              {graphConfig.functions.map((func, idx) => (
                <div key={func.id || idx} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: func.color }}
                  />
                  <span className="font-mono">y = {func.expression}</span>
                  {func.label && <span className="text-gray-500">({func.label})</span>}
                  {graphConfig.answerType === "function" && graphConfig.correctFunctionId === func.id && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Correcta
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lines/scatter plots */}
        {graphConfig.lines && graphConfig.lines.length > 0 && (
          <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
            <h5 className="font-medium text-purple-700 mb-2">Líneas/Puntos</h5>
            <div className="space-y-2">
              {graphConfig.lines.map((line, idx) => (
                <div key={line.id || idx} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: line.color }}
                  />
                  <span>
                    {line.type === "scatter" ? "Puntos" : "Línea"} ({line.points.length} puntos)
                  </span>
                  {line.label && <span className="text-gray-500">- {line.label}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode indicator */}
        {graphConfig.isInteractive ? (
          <div className="p-3 rounded-lg border border-green-200 bg-green-50 flex items-start gap-2">
            <Info className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <p className="text-sm text-green-700">
              <strong>Modo Interactivo:</strong>{" "}
              {graphConfig.answerType === "point" && "El estudiante debe hacer clic en el gráfico para marcar el punto correcto."}
              {graphConfig.answerType === "function" && "El estudiante debe seleccionar la función correcta."}
              {graphConfig.answerType === "area" && "El estudiante debe marcar un área en el gráfico."}
              {!graphConfig.answerType && "El estudiante debe interactuar con el gráfico."}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 flex items-start gap-2">
            <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700">
              <strong>Modo Orientativo:</strong> El gráfico se muestra junto al enunciado como referencia visual para la pregunta.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost">
            <Link href="/dashboard/questions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Banco
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/questions/${questionId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Pregunta
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{question.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {subject && (
                      <Badge
                        variant="secondary"
                        className={SUBJECT_COLORS[subject.color] || "bg-gray-100 text-gray-800"}
                      >
                        {subject.name}
                      </Badge>
                    )}
                    {topic && (
                      <Badge
                        variant="secondary"
                        className={SUBJECT_COLORS[topic.color] || "bg-gray-100 text-gray-800"}
                      >
                        {topic.name}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {QUESTION_TYPE_LABELS[question.questionType]}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={DIFFICULTY_COLORS[question.difficulty]}
                    >
                      {DIFFICULTY_LABELS[question.difficulty]}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  <span>Peso: {question.weight}</span>
                </div>
                {question.estimatedTimeMinutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>~{question.estimatedTimeMinutes} min</span>
                  </div>
                )}
                {question.timesUsed !== undefined && (
                  <span>Usado {question.timesUsed} veces</span>
                )}
                {question.averageScore !== undefined && question.averageScore !== null && (
                  <span>Promedio: {(question.averageScore * 100).toFixed(0)}%</span>
                )}
              </div>
              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enunciado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enunciado</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: question.content }}
              />
            </CardContent>
          </Card>

          {/* Configuración del tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Respuesta</CardTitle>
            </CardHeader>
            <CardContent>
              {question.questionType === "multiple_choice" && renderMultipleChoiceOptions()}
              {question.questionType === "numeric" && renderNumericConfig()}
              {question.questionType === "open_text" && renderOpenTextConfig()}
              {question.questionType === "graph_click" && renderGraphConfig()}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className="text-gray-500">Creada</p>
                  <p className="text-gray-900">
                    {new Date(question.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Última actualización</p>
                  <p className="text-gray-900">
                    {new Date(question.updatedAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
