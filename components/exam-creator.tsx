"use client"

import type React from "react"

import { useState } from "react"
import { authFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuestionEditor } from "@/components/question-editor"
import { useRouter } from "next/navigation"
import type { ExamLevel } from "@/lib/types"
import { Plus, Save } from "lucide-react"

interface ExamCreatorProps {
  levels: ExamLevel[]
  teacherId: string
}

interface Question {
  id: string
  question_text: string
  question_latex: string
  question_image_url: string
  question_graph_data: any
  points: number
  order: number
  options: {
    id: string
    option_text: string
    option_latex: string
    option_image_url: string
    is_correct: boolean
    order: number
  }[]
}

export function ExamCreator({ levels, teacherId }: ExamCreatorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [levelId, setLevelId] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question_text: "",
      question_latex: "",
      question_image_url: "",
      question_graph_data: null,
      points: 1,
      order: questions.length + 1,
      options: [],
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authFetch("/api/exams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          level_id: levelId || null,
          duration_minutes: durationMinutes ? Number.parseInt(durationMinutes) : null,
          teacher_id: teacherId,
          questions,
        }),
      })

      if (!response.ok) throw new Error("Error creating exam")

      const data = await response.json()
      router.push(`/dashboard/exams/${data.exam.id}`)
    } catch (error) {
      console.error("[v0] Error creating exam:", error)
      alert("Error al crear el examen")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Examen</CardTitle>
          <CardDescription>Completa los detalles básicos del examen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Examen</Label>
            <Input
              id="title"
              placeholder="Ej: Examen de Física - Cinemática"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe el contenido del examen..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
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
                placeholder="60"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Preguntas</h2>
          <Button type="button" onClick={addQuestion} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Pregunta
          </Button>
        </div>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">No hay preguntas todavía. Agrega la primera pregunta.</p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onUpdate={updateQuestion}
              onRemove={removeQuestion}
            />
          ))
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || questions.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Guardando..." : "Crear Examen"}
        </Button>
      </div>
    </form>
  )
}
