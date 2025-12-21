"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, FileJson, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  readFileAsText,
  parseQuestionBankImport,
  parseExamImport,
  type QuestionBankExport,
  type ExamExport,
} from "@/lib/export-import"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "questions" | "exam"
  onImport: (data: QuestionBankExport | ExamExport) => Promise<void>
}

export function ImportDialog({
  open,
  onOpenChange,
  type,
  onImport,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<QuestionBankExport | ExamExport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setPreview(null)

    try {
      const content = await readFileAsText(selectedFile)

      if (type === "questions") {
        const result = parseQuestionBankImport(content)
        if (result.success && result.data) {
          setPreview(result.data)
        } else {
          setError(result.error || "Error desconocido")
        }
      } else {
        const result = parseExamImport(content)
        if (result.success && result.data) {
          setPreview(result.data)
        } else {
          setError(result.error || "Error desconocido")
        }
      }
    } catch {
      setError("Error al leer el archivo")
    }
  }

  const handleImport = async () => {
    if (!preview) return

    setImporting(true)
    try {
      await onImport(preview)
      onOpenChange(false)
      resetState()
    } catch (err) {
      setError("Error al importar los datos")
    } finally {
      setImporting(false)
    }
  }

  const resetState = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState()
    }
    onOpenChange(open)
  }

  const getPreviewInfo = () => {
    if (!preview) return null

    if (preview.type === "question_bank") {
      const qb = preview as QuestionBankExport
      return {
        title: "Banco de Preguntas",
        items: [
          { label: "Preguntas", value: qb.questions.length },
          { label: "Temas", value: qb.topics?.length || 0 },
        ],
      }
    } else {
      const exam = preview as ExamExport
      return {
        title: exam.exam.title,
        items: [
          { label: "Preguntas", value: exam.exam.questions.length },
          {
            label: "Duración",
            value: exam.exam.duration_minutes
              ? `${exam.exam.duration_minutes} min`
              : "Sin límite",
          },
        ],
      }
    }
  }

  const previewInfo = getPreviewInfo()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Importar {type === "questions" ? "Preguntas" : "Examen"}
          </DialogTitle>
          <DialogDescription>
            Selecciona un archivo JSON para importar{" "}
            {type === "questions"
              ? "preguntas a tu banco"
              : "un examen con sus preguntas"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              error
                ? "border-red-300 bg-red-50"
                : preview
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {!file ? (
              <>
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Solo archivos .json
                </p>
              </>
            ) : error ? (
              <>
                <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                <p className="text-sm font-medium text-red-600">{error}</p>
                <p className="text-xs text-red-400 mt-1">
                  Haz clic para seleccionar otro archivo
                </p>
              </>
            ) : preview ? (
              <>
                <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm font-medium text-green-700">
                  Archivo válido
                </p>
                <p className="text-xs text-green-600 mt-1">{file.name}</p>
              </>
            ) : null}
          </div>

          {/* Preview */}
          {previewInfo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileJson className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-900">
                  {previewInfo.title}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {previewInfo.items.map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-500">{item.label}:</span>
                    <span className="font-medium text-gray-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              {preview?.exported_at && (
                <p className="text-xs text-gray-400 mt-3">
                  Exportado: {new Date(preview.exported_at).toLocaleDateString("es-ES")}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={importing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview || importing}
          >
            {importing ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
