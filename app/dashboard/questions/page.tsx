"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import type {
  BankQuestion,
  QuestionTopic,
  QuestionType,
  QuestionDifficulty,
} from "@/lib/types"
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const TOPIC_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
}

export default function QuestionBankPage() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<BankQuestion[]>([])
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [search, setSearch] = useState("")
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      if (USE_MOCK_DATA) {
        setQuestions(MOCK_DATA.bankQuestions)
        setTopics(MOCK_DATA.topics)
      } else {
        setQuestions([])
        setTopics([])
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

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))

    const matchesTopic = topicFilter === "all" || q.topic_id === topicFilter
    const matchesType = typeFilter === "all" || q.question_type === typeFilter
    const matchesDifficulty =
      difficultyFilter === "all" || q.difficulty === difficultyFilter

    return matchesSearch && matchesTopic && matchesType && matchesDifficulty
  })

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando preguntas...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <p className="text-gray-500">
          {questions.length} preguntas en tu banco
        </p>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título o tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los temas</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={difficultyFilter}
                  onValueChange={setDifficultyFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredQuestions.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="flex h-64 flex-col items-center justify-center">
                <p className="mb-4 text-muted-foreground">
                  {questions.length === 0
                    ? "No tienes preguntas en tu banco"
                    : "No se encontraron preguntas con esos filtros"}
                </p>
                {questions.length === 0 && (
                  <Button asChild>
                    <Link href="/dashboard/questions/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear tu primera pregunta
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredQuestions.map((question) => {
                const topic = getTopicById(question.topic_id)

                return (
                  <Card
                    key={question.id}
                    className="border-gray-200 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {question.title}
                          </CardTitle>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {topic && (
                              <Badge
                                variant="secondary"
                                className={TOPIC_COLORS[topic.color] || ""}
                              >
                                {topic.name}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {QUESTION_TYPE_LABELS[question.question_type]}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={DIFFICULTY_COLORS[question.difficulty]}
                            >
                              {DIFFICULTY_LABELS[question.difficulty]}
                            </Badge>
                            <Badge variant="secondary">
                              {question.default_points} pts
                            </Badge>
                            {question.estimated_time_minutes && (
                              <Badge variant="secondary">
                                ~{question.estimated_time_minutes} min
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/questions/${question.id}`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="prose prose-sm max-w-none line-clamp-2 text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html:
                            question.content.replace(/<[^>]*>/g, " ").slice(0, 200) +
                            "...",
                        }}
                      />
                      <div className="mt-3 flex flex-wrap gap-1">
                        {question.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      {(question.times_used !== undefined ||
                        question.average_score !== undefined) && (
                        <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                          {question.times_used !== undefined && (
                            <span>Usado {question.times_used} veces</span>
                          )}
                          {question.average_score !== undefined && (
                            <span>
                              Promedio: {(question.average_score * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
    </main>
  )
}
