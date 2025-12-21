"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import type {
  Subject,
  QuestionTopic,
  QuestionType,
  QuestionDifficulty,
  MultipleChoiceConfig,
  NumericConfig,
  GraphClickConfig,
} from "@/lib/types"
import { ArrowLeft, Plus, Trash2, Save, GripVertical, LineChart } from "lucide-react"
import { GraphEditor, type GraphConfig } from "@/components/graph-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TiptapEditor } from "@/components/tiptap-editor"
import Link from "next/link"
import { toast } from "sonner"

const QUESTION_TYPES: { value: QuestionType; label: string; description: string }[] = [
  {
    value: "multiple_choice",
    label: "Opción Múltiple",
    description: "El estudiante selecciona una o más opciones correctas",
  },
  {
    value: "numeric",
    label: "Numérica",
    description: "El estudiante ingresa un valor numérico con tolerancia",
  },
  {
    value: "graph_click",
    label: "Gráfico",
    description: "Incluye un gráfico (orientativo o interactivo)",
  },
  {
    value: "open_text",
    label: "Respuesta Abierta",
    description: "El estudiante escribe una respuesta de texto libre",
  },
]

const DIFFICULTY_OPTIONS: { value: QuestionDifficulty; label: string }[] = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Medio" },
  { value: "hard", label: "Difícil" },
]

// Validation schema
const questionSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El enunciado es requerido"),
  subject_id: z.string().optional(),
  topic_id: z.string().optional(),
  question_type: z.enum(["multiple_choice", "numeric", "graph_click", "image_hotspot", "open_text"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimated_time_minutes: z.number().min(1).max(120).optional(),
  weight: z.number().min(1).max(10), // Peso relativo de la pregunta en el examen
  tags: z.array(z.string()),
})

type QuestionFormData = z.infer<typeof questionSchema>

interface MultipleChoiceOption {
  id: string
  text: string
  is_correct: boolean
}

export default function CreateQuestionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Question type specific state
  const [mcOptions, setMcOptions] = useState<MultipleChoiceOption[]>([
    { id: crypto.randomUUID(), text: "", is_correct: false },
  ])
  const [mcAllowMultiple, setMcAllowMultiple] = useState(false)
  const [mcShuffleOptions, setMcShuffleOptions] = useState(true)

  // Numeric config state
  const [numericValue, setNumericValue] = useState<number>(0)
  const [numericTolerance, setNumericTolerance] = useState<number>(5)
  const [numericToleranceType, setNumericToleranceType] = useState<"percentage" | "absolute">("percentage")
  const [numericUnit, setNumericUnit] = useState<string>("")

  // Graph config state
  const [graphConfig, setGraphConfig] = useState<GraphConfig>({
    xRange: [-10, 10],
    yRange: [-10, 10],
    xLabel: "x",
    yLabel: "y",
    showGrid: true,
    gridStep: 1,
    lines: [],
    functions: [],
    toleranceRadius: 0.5,
    isInteractive: false,
  })

  // Tags state
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      content: "",
      subject_id: "",
      topic_id: "",
      question_type: "multiple_choice",
      difficulty: "medium",
      estimated_time_minutes: 5,
      weight: 1,
      tags: [],
    },
  })

  const selectedSubjectId = watch("subject_id")

  const questionType = watch("question_type")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      if (USE_MOCK_DATA) {
        setSubjects(MOCK_DATA.subjects)
        setTopics(MOCK_DATA.topics)
      } else {
        // TODO: Implement real API call
        setSubjects([])
        setTopics([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  // Filter topics based on selected subject
  const filteredTopics = selectedSubjectId
    ? topics.filter((t) => t.subject_id === selectedSubjectId)
    : topics

  const addMcOption = () => {
    setMcOptions([...mcOptions, { id: crypto.randomUUID(), text: "", is_correct: false }])
  }

  const removeMcOption = (id: string) => {
    if (mcOptions.length > 1) {
      setMcOptions(mcOptions.filter((opt) => opt.id !== id))
    }
  }

  const updateMcOption = (id: string, updates: Partial<MultipleChoiceOption>) => {
    setMcOptions(mcOptions.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt)))
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag]
      setTags(newTags)
      setValue("tags", newTags)
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag)
    setTags(newTags)
    setValue("tags", newTags)
  }

  const onSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true)

    try {
      // Build type config based on question type
      let typeConfig: MultipleChoiceConfig | NumericConfig | GraphClickConfig | object = {}

      if (data.question_type === "multiple_choice") {
        const hasCorrect = mcOptions.some((opt) => opt.is_correct)
        if (!hasCorrect) {
          toast.error("Debe haber al menos una opción correcta")
          setIsSubmitting(false)
          return
        }

        typeConfig = {
          options: mcOptions.map((opt, idx) => ({
            id: opt.id,
            text: opt.text,
            is_correct: opt.is_correct,
            order: idx + 1,
          })),
          allow_multiple: mcAllowMultiple,
          shuffle_options: mcShuffleOptions,
        } as MultipleChoiceConfig
      } else if (data.question_type === "numeric") {
        typeConfig = {
          correct_value: numericValue,
          tolerance: numericTolerance,
          tolerance_type: numericToleranceType,
          unit: numericUnit || null,
          show_unit_input: false,
        } as NumericConfig
      } else if (data.question_type === "graph_click") {
        // Validate graph config if interactive
        if (graphConfig.isInteractive && !graphConfig.correctPoint) {
          toast.error("Debes definir el punto correcto para preguntas interactivas")
          setIsSubmitting(false)
          return
        }

        typeConfig = {
          graph_type: "cartesian",
          image_url: null,
          correct_point: graphConfig.correctPoint || { x: 0, y: 0 },
          tolerance_radius: graphConfig.toleranceRadius,
          x_range: graphConfig.xRange,
          y_range: graphConfig.yRange,
          grid_visible: graphConfig.showGrid,
          axis_labels: { x: graphConfig.xLabel, y: graphConfig.yLabel },
          // Store additional graph data for rendering
          graph_data: {
            title: graphConfig.title,
            gridStep: graphConfig.gridStep,
            lines: graphConfig.lines,
            functions: graphConfig.functions,
            isInteractive: graphConfig.isInteractive,
          },
        } as GraphClickConfig & { graph_data: object }
      }

      const questionData = {
        ...data,
        teacher_id: user!.id,
        type_config: typeConfig,
        tags,
      }

      if (USE_MOCK_DATA) {
        // Add to mock data
        const newQuestion = {
          id: crypto.randomUUID(),
          ...questionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          times_used: 0,
          average_score: 0,
        }
        MOCK_DATA.bankQuestions.push(newQuestion as any)
        toast.success("Pregunta creada exitosamente")
        router.push("/dashboard/questions")
      } else {
        // TODO: Real API call
        const response = await fetch("/api/questions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData),
        })

        if (!response.ok) throw new Error("Error creating question")
        toast.success("Pregunta creada exitosamente")
        router.push("/dashboard/questions")
      }
    } catch (error) {
      console.error("Error creating question:", error)
      toast.error("Error al crear la pregunta")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard/questions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Banco
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Pregunta</h1>
          <p className="text-muted-foreground">
            Agrega una pregunta a tu banco de preguntas
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Título y metadatos de la pregunta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título (para identificación)</Label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="title"
                      placeholder="Ej: Cálculo de altura máxima en tiro vertical"
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Asignatura</Label>
                  <Controller
                    name="subject_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          // Clear topic when subject changes
                          setValue("topic_id", "")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una asignatura" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Controller
                    name="topic_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedSubjectId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedSubjectId ? "Selecciona un tema" : "Primero selecciona asignatura"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredTopics.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Dificultad</Label>
                  <Controller
                    name="difficulty"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (1-10)</Label>
                  <Controller
                    name="weight"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max="10"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Peso relativo en el promedio del examen
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Tiempo estimado (min)</Label>
                  <Controller
                    name="estimated_time_minutes"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max="120"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Agregar tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Agregar
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Content */}
          <Card>
            <CardHeader>
              <CardTitle>Enunciado de la Pregunta</CardTitle>
              <CardDescription>
                Usa el editor para escribir el enunciado. Puedes incluir ecuaciones LaTeX con $...$
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <TiptapEditor
                    content={field.value}
                    onChange={field.onChange}
                    placeholder="Escribe el enunciado de la pregunta..."
                    minHeight="200px"
                  />
                )}
              />
              {errors.content && (
                <p className="text-sm text-red-500 mt-2">{errors.content.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Question Type */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Pregunta</CardTitle>
              <CardDescription>Selecciona cómo responderán los estudiantes</CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                name="question_type"
                control={control}
                render={({ field }) => (
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <TabsList className="grid w-full grid-cols-4">
                      {QUESTION_TYPES.map((type) => (
                        <TabsTrigger key={type.value} value={type.value}>
                          {type.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* Multiple Choice Config */}
                    <TabsContent value="multiple_choice" className="space-y-4 mt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="allowMultiple"
                            checked={mcAllowMultiple}
                            onCheckedChange={(checked) => setMcAllowMultiple(checked as boolean)}
                          />
                          <Label htmlFor="allowMultiple">Permitir múltiples respuestas</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="shuffleOptions"
                            checked={mcShuffleOptions}
                            onCheckedChange={(checked) => setMcShuffleOptions(checked as boolean)}
                          />
                          <Label htmlFor="shuffleOptions">Mezclar opciones</Label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Opciones de respuesta</Label>
                        {mcOptions.map((option, index) => (
                          <div key={option.id} className="flex items-start gap-2 rounded-md border p-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                            <Checkbox
                              checked={option.is_correct}
                              onCheckedChange={(checked) =>
                                updateMcOption(option.id, { is_correct: checked as boolean })
                              }
                              className="mt-2"
                            />
                            <div className="flex-1">
                              <TiptapEditor
                                content={option.text}
                                onChange={(text) => updateMcOption(option.id, { text })}
                                placeholder={`Opción ${index + 1}`}
                                minHeight="60px"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMcOption(option.id)}
                              disabled={mcOptions.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addMcOption}>
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Opción
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Numeric Config */}
                    <TabsContent value="numeric" className="space-y-4 mt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Valor correcto</Label>
                          <Input
                            type="number"
                            step="any"
                            value={numericValue}
                            onChange={(e) => setNumericValue(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unidad (opcional)</Label>
                          <Input
                            value={numericUnit}
                            onChange={(e) => setNumericUnit(e.target.value)}
                            placeholder="Ej: m/s, kg, J"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Tolerancia</Label>
                          <Input
                            type="number"
                            step="any"
                            value={numericTolerance}
                            onChange={(e) => setNumericTolerance(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de tolerancia</Label>
                          <Select
                            value={numericToleranceType}
                            onValueChange={(v) => setNumericToleranceType(v as "percentage" | "absolute")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                              <SelectItem value="absolute">Valor absoluto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {numericToleranceType === "percentage"
                          ? `Se aceptarán valores entre ${(numericValue * (1 - numericTolerance / 100)).toFixed(2)} y ${(numericValue * (1 + numericTolerance / 100)).toFixed(2)}`
                          : `Se aceptarán valores entre ${numericValue - numericTolerance} y ${numericValue + numericTolerance}`}
                      </p>
                    </TabsContent>

                    {/* Graph Click Config */}
                    <TabsContent value="graph_click" className="space-y-4 mt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <LineChart className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-800">Editor de Gráficos</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Crea gráficos con funciones y puntos. Puedes hacer que sea solo orientativo
                          o interactivo (donde el estudiante marca un punto como respuesta).
                        </p>
                      </div>

                      <GraphEditor
                        config={graphConfig}
                        onChange={setGraphConfig}
                        mode="edit"
                      />

                      {graphConfig.isInteractive && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-700">
                            <strong>Modo Interactivo:</strong> El estudiante deberá hacer clic en el punto correcto
                            ({graphConfig.correctPoint?.x ?? 0}, {graphConfig.correctPoint?.y ?? 0}) con tolerancia de {graphConfig.toleranceRadius} unidades.
                          </p>
                        </div>
                      )}

                      {!graphConfig.isInteractive && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-700">
                            <strong>Modo Orientativo:</strong> El gráfico se mostrará junto al enunciado.
                            Usa otro tipo de pregunta (opción múltiple, numérica) para la respuesta.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Open Text Config */}
                    <TabsContent value="open_text" className="mt-4">
                      <p className="text-muted-foreground">
                        Los estudiantes escribirán una respuesta libre. Deberás calificar manualmente.
                      </p>
                    </TabsContent>
                  </Tabs>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar Pregunta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
