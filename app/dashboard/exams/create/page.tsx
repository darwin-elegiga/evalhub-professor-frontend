"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import type {
  ExamLevel,
  BankQuestion,
  QuestionTopic,
  QuestionType,
  QuestionDifficulty,
} from "@/lib/types"
import {
  ArrowLeft,
  Plus,
  Save,
  Search,
  Trash2,
  ChevronUp,
  ChevronDown,
  Library,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { toast } from "sonner"

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

const TOPIC_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
}

interface SelectedQuestion {
  id: string
  bankQuestion: BankQuestion
  points: number
  order: number
}

export default function CreateExamPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [levels, setLevels] = useState<ExamLevel[]>([])
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([])
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Exam form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [levelId, setLevelId] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("")

  // Exam config state
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [shuffleOptions, setShuffleOptions] = useState(true)
  const [showResultsImmediately, setShowResultsImmediately] = useState(false)
  const [penaltyEnabled, setPenaltyEnabled] = useState(false)
  const [penaltyValue, setPenaltyValue] = useState(0.25)
  const [passingPercentage, setPassingPercentage] = useState(60)

  // Selected questions
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])

  // Question bank filters
  const [bankSearch, setBankSearch] = useState("")
  const [bankTopicFilter, setBankTopicFilter] = useState("all")
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)

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
        setLevels(MOCK_DATA.levels)
        setBankQuestions(MOCK_DATA.bankQuestions)
        setTopics(MOCK_DATA.topics)
      } else {
        // TODO: Implement real API calls
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const getTopicById = (id: string | null) => {
    if (!id) return null
    return topics.find((t) => t.id === id)
  }

  // Filter available questions (not already selected)
  const availableQuestions = useMemo(() => {
    const selectedIds = new Set(selectedQuestions.map((sq) => sq.bankQuestion.id))

    return bankQuestions.filter((q) => {
      if (selectedIds.has(q.id)) return false

      const matchesSearch =
        bankSearch === "" ||
        q.title.toLowerCase().includes(bankSearch.toLowerCase()) ||
        q.tags.some((tag) => tag.toLowerCase().includes(bankSearch.toLowerCase()))

      const matchesTopic = bankTopicFilter === "all" || q.topic_id === bankTopicFilter
      const matchesDifficulty = bankDifficultyFilter === "all" || q.difficulty === bankDifficultyFilter

      return matchesSearch && matchesTopic && matchesDifficulty
    })
  }, [bankQuestions, selectedQuestions, bankSearch, bankTopicFilter, bankDifficultyFilter])

  const addQuestion = (question: BankQuestion) => {
    setSelectedQuestions([
      ...selectedQuestions,
      {
        id: crypto.randomUUID(),
        bankQuestion: question,
        points: question.default_points,
        order: selectedQuestions.length + 1,
      },
    ])
  }

  const removeQuestion = (id: string) => {
    setSelectedQuestions(
      selectedQuestions
        .filter((sq) => sq.id !== id)
        .map((sq, idx) => ({ ...sq, order: idx + 1 }))
    )
  }

  const updateQuestionPoints = (id: string, points: number) => {
    setSelectedQuestions(
      selectedQuestions.map((sq) => (sq.id === id ? { ...sq, points } : sq))
    )
  }

  const moveQuestion = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= selectedQuestions.length) return

    const newQuestions = [...selectedQuestions]
    const [removed] = newQuestions.splice(fromIndex, 1)
    newQuestions.splice(toIndex, 0, removed)

    setSelectedQuestions(newQuestions.map((sq, idx) => ({ ...sq, order: idx + 1 })))
  }

  const totalPoints = selectedQuestions.reduce((sum, sq) => sum + sq.points, 0)
  const estimatedTime = selectedQuestions.reduce(
    (sum, sq) => sum + (sq.bankQuestion.estimated_time_minutes || 0),
    0
  )

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("El título es requerido")
      return
    }

    if (selectedQuestions.length === 0) {
      toast.error("Agrega al menos una pregunta")
      return
    }

    setIsSubmitting(true)

    try {
      const examData = {
        title,
        description,
        level_id: levelId || null,
        duration_minutes: durationMinutes ? Number(durationMinutes) : null,
        teacher_id: user!.id,
        config: {
          shuffle_questions: shuffleQuestions,
          shuffle_options: shuffleOptions,
          show_results_immediately: showResultsImmediately,
          allow_review: true,
          penalty_per_wrong_answer: penaltyEnabled ? penaltyValue : null,
          passing_percentage: passingPercentage,
        },
        questions: selectedQuestions.map((sq) => ({
          bank_question_id: sq.bankQuestion.id,
          points: sq.points,
          question_order: sq.order,
        })),
      }

      if (USE_MOCK_DATA) {
        const newExam = {
          id: crypto.randomUUID(),
          teacher_id: user!.id,
          level_id: levelId || null,
          title,
          description,
          duration_minutes: durationMinutes ? Number(durationMinutes) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        MOCK_DATA.exams.push(newExam as any)
        toast.success("Examen creado exitosamente")
        router.push(`/dashboard/exams/${newExam.id}`)
      } else {
        const response = await fetch("/api/exams/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(examData),
        })

        if (!response.ok) throw new Error("Error creating exam")

        const data = await response.json()
        toast.success("Examen creado exitosamente")
        router.push(`/dashboard/exams/${data.exam.id}`)
      }
    } catch (error) {
      console.error("Error creating exam:", error)
      toast.error("Error al crear el examen")
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Examen</h1>
            <p className="text-muted-foreground">
              Selecciona preguntas de tu banco para crear el examen
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Examen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Examen *</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Examen de Física - Cinemática"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe el contenido del examen..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nivel</Label>
                    <Select value={levelId} onValueChange={setLevelId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder={estimatedTime ? `Sugerido: ${estimatedTime}` : "Sin límite"}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Questions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Preguntas del Examen</CardTitle>
                  <CardDescription>
                    {selectedQuestions.length} preguntas · {totalPoints} puntos totales
                  </CardDescription>
                </div>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button>
                      <Library className="mr-2 h-4 w-4" />
                      Agregar del Banco
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-xl">
                    <SheetHeader>
                      <SheetTitle>Banco de Preguntas</SheetTitle>
                      <SheetDescription>
                        Selecciona preguntas para agregar al examen
                      </SheetDescription>
                    </SheetHeader>

                    <div className="mt-4 space-y-4">
                      {/* Filters */}
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Buscar..."
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Select value={bankTopicFilter} onValueChange={setBankTopicFilter}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Tema" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              {topics.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={bankDifficultyFilter} onValueChange={setBankDifficultyFilter}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Dificultad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* Questions List */}
                      <ScrollArea className="h-[calc(100vh-300px)]">
                        <div className="space-y-2 pr-4">
                          {availableQuestions.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                              {bankQuestions.length === selectedQuestions.length
                                ? "Todas las preguntas ya están en el examen"
                                : "No se encontraron preguntas"}
                            </div>
                          ) : (
                            availableQuestions.map((question) => {
                              const topic = getTopicById(question.topic_id)
                              return (
                                <div
                                  key={question.id}
                                  className="rounded-md border p-3 hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    addQuestion(question)
                                    toast.success("Pregunta agregada")
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{question.title}</p>
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {topic && (
                                          <Badge
                                            variant="secondary"
                                            className={`text-xs ${TOPIC_COLORS[topic.color] || ""}`}
                                          >
                                            {topic.name}
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          {QUESTION_TYPE_LABELS[question.question_type]}
                                        </Badge>
                                        <Badge
                                          variant="secondary"
                                          className={`text-xs ${DIFFICULTY_COLORS[question.difficulty]}`}
                                        >
                                          {DIFFICULTY_LABELS[question.difficulty]}
                                        </Badge>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </SheetContent>
                </Sheet>
              </CardHeader>
              <CardContent>
                {selectedQuestions.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed">
                    <Library className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No hay preguntas. Agrega desde el banco de preguntas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedQuestions.map((sq, index) => {
                      const topic = getTopicById(sq.bankQuestion.topic_id)
                      return (
                        <div
                          key={sq.id}
                          className="flex items-center gap-2 rounded-md border p-3"
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveQuestion(index, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveQuestion(index, "down")}
                              disabled={index === selectedQuestions.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                            {index + 1}
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-sm">{sq.bankQuestion.title}</p>
                            <div className="mt-1 flex gap-1">
                              {topic && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${TOPIC_COLORS[topic.color] || ""}`}
                                >
                                  {topic.name}
                                </Badge>
                              )}
                              <Badge
                                variant="secondary"
                                className={`text-xs ${DIFFICULTY_COLORS[sq.bankQuestion.difficulty]}`}
                              >
                                {DIFFICULTY_LABELS[sq.bankQuestion.difficulty]}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              className="w-20 text-center"
                              value={sq.points}
                              onChange={(e) =>
                                updateQuestionPoints(sq.id, Number(e.target.value))
                              }
                            />
                            <span className="text-sm text-muted-foreground">pts</span>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(sq.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Exam Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mezclar preguntas</Label>
                    <p className="text-xs text-muted-foreground">
                      Orden aleatorio por estudiante
                    </p>
                  </div>
                  <Switch
                    checked={shuffleQuestions}
                    onCheckedChange={setShuffleQuestions}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mezclar opciones</Label>
                    <p className="text-xs text-muted-foreground">
                      Opciones en orden aleatorio
                    </p>
                  </div>
                  <Switch
                    checked={shuffleOptions}
                    onCheckedChange={setShuffleOptions}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostrar resultados</Label>
                    <p className="text-xs text-muted-foreground">
                      Al terminar el examen
                    </p>
                  </div>
                  <Switch
                    checked={showResultsImmediately}
                    onCheckedChange={setShowResultsImmediately}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Penalización</Label>
                    <Switch
                      checked={penaltyEnabled}
                      onCheckedChange={setPenaltyEnabled}
                    />
                  </div>
                  {penaltyEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-20"
                        value={penaltyValue}
                        onChange={(e) => setPenaltyValue(Number(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">
                        ({(penaltyValue * 100).toFixed(0)}% por error)
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Porcentaje para aprobar</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="w-20"
                      value={passingPercentage}
                      onChange={(e) => setPassingPercentage(Number(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preguntas:</span>
                  <span className="font-medium">{selectedQuestions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Puntos totales:</span>
                  <span className="font-medium">{totalPoints}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiempo estimado:</span>
                  <span className="font-medium">{estimatedTime || "—"} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mínimo para aprobar:</span>
                  <span className="font-medium">
                    {Math.ceil((passingPercentage / 100) * totalPoints)} pts
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || selectedQuestions.length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Guardando..." : "Crear Examen"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
