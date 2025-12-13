"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, ImageIcon, FenceIcon as Function } from "lucide-react"
import { LatexPreview } from "@/components/latex-preview"

interface QuestionOption {
  id: string
  option_text: string
  option_latex: string
  option_image_url: string
  is_correct: boolean
  order: number
}

interface Question {
  id: string
  question_text: string
  question_latex: string
  question_image_url: string
  question_graph_data: any
  points: number
  order: number
  options: QuestionOption[]
}

interface QuestionEditorProps {
  question: Question
  index: number
  onUpdate: (id: string, updates: Partial<Question>) => void
  onRemove: (id: string) => void
}

export function QuestionEditor({ question, index, onUpdate, onRemove }: QuestionEditorProps) {
  const [showLatex, setShowLatex] = useState(false)

  const addOption = () => {
    const newOption: QuestionOption = {
      id: crypto.randomUUID(),
      option_text: "",
      option_latex: "",
      option_image_url: "",
      is_correct: false,
      order: question.options.length + 1,
    }
    onUpdate(question.id, { options: [...question.options, newOption] })
  }

  const updateOption = (optionId: string, updates: Partial<QuestionOption>) => {
    const updatedOptions = question.options.map((opt) => (opt.id === optionId ? { ...opt, ...updates } : opt))
    onUpdate(question.id, { options: updatedOptions })
  }

  const removeOption = (optionId: string) => {
    const updatedOptions = question.options.filter((opt) => opt.id !== optionId)
    onUpdate(question.id, { options: updatedOptions })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Pregunta {index + 1}</CardTitle>
        <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(question.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Texto de la Pregunta</Label>
          <Textarea
            placeholder="Escribe la pregunta..."
            rows={3}
            value={question.question_text}
            onChange={(e) => onUpdate(question.id, { question_text: e.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowLatex(!showLatex)}>
            <Function className="mr-2 h-4 w-4" />
            {showLatex ? "Ocultar" : "Agregar"} LaTeX
          </Button>
          <Button type="button" variant="outline" size="sm">
            <ImageIcon className="mr-2 h-4 w-4" />
            Agregar Imagen
          </Button>
        </div>

        {showLatex && (
          <div className="space-y-2">
            <Label>Ecuación LaTeX</Label>
            <Input
              placeholder="Ej: F = ma, E = mc^2"
              value={question.question_latex}
              onChange={(e) => onUpdate(question.id, { question_latex: e.target.value })}
            />
            {question.question_latex && (
              <div className="rounded-md border bg-white p-4">
                <LatexPreview latex={question.question_latex} />
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Puntos</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={question.points}
            onChange={(e) => onUpdate(question.id, { points: Number.parseFloat(e.target.value) || 0 })}
            className="w-32"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Opciones de Respuesta</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Opción
            </Button>
          </div>

          {question.options.map((option, optIndex) => (
            <div key={option.id} className="flex items-start gap-2 rounded-md border p-3">
              <Checkbox
                checked={option.is_correct}
                onCheckedChange={(checked) => updateOption(option.id, { is_correct: checked as boolean })}
              />
              <div className="flex-1 space-y-2">
                <Input
                  placeholder={`Opción ${optIndex + 1}`}
                  value={option.option_text}
                  onChange={(e) => updateOption(option.id, { option_text: e.target.value })}
                />
                <Input
                  placeholder="LaTeX opcional"
                  value={option.option_latex}
                  onChange={(e) => updateOption(option.id, { option_latex: e.target.value })}
                  className="text-sm"
                />
                {option.option_latex && (
                  <div className="rounded-md bg-gray-50 p-2">
                    <LatexPreview latex={option.option_latex} />
                  </div>
                )}
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(option.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}

          {question.options.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay opciones todavía. Agrega al menos una opción.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
