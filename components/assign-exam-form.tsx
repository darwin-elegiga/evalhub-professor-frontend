"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Exam, Student } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Send, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface AssignExamFormProps {
  exam: Exam
  students: Student[]
}

interface MagicLink {
  student_id: string
  student_name: string
  magic_token: string
  url: string
}

export function AssignExamForm({ exam, students }: AssignExamFormProps) {
  const router = useRouter()
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinks, setMagicLinks] = useState<MagicLink[]>([])
  const [showLinksDialog, setShowLinksDialog] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const toggleAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map((s) => s.id))
    }
  }

  const copyToClipboard = async (text: string, token: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      alert("Selecciona al menos un estudiante")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/exams/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: exam.id,
          student_ids: selectedStudents,
        }),
      })

      if (!response.ok) throw new Error("Error assigning exam")

      const data = await response.json()
      setMagicLinks(data.assignments)
      setShowLinksDialog(true)
    } catch (error) {
      console.error("[v0] Error assigning exam:", error)
      alert("Error al asignar el examen")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Seleccionar Estudiantes</CardTitle>
          <CardDescription>
            Selecciona los estudiantes a los que deseas asignar este examen. Se generarán magic links únicos para cada
            uno.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-4">
            <Checkbox
              id="select-all"
              checked={selectedStudents.length === students.length && students.length > 0}
              onCheckedChange={toggleAll}
            />
            <Label htmlFor="select-all" className="font-semibold">
              Seleccionar Todos ({students.length})
            </Label>
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {students.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No hay estudiantes registrados</p>
              </div>
            ) : (
              students.map((student) => (
                <div key={student.id} className="flex items-center gap-3 rounded-md border p-3 hover:bg-gray-50">
                  <Checkbox
                    id={student.id}
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <Label htmlFor={student.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{student.full_name}</div>
                    <div className="text-sm text-muted-foreground">{student.email}</div>
                  </Label>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={isLoading || selectedStudents.length === 0}>
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? "Asignando..." : `Asignar a ${selectedStudents.length} estudiante(s)`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showLinksDialog} onOpenChange={setShowLinksDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Magic Links Generados</DialogTitle>
            <DialogDescription>
              Copia y envía estos enlaces únicos a cada estudiante. Cada enlace solo funciona para un estudiante
              específico.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {magicLinks.map((link) => (
              <div key={link.student_id} className="rounded-md border p-4">
                <div className="mb-2 font-medium">{link.student_name}</div>
                <div className="flex gap-2">
                  <Input value={link.url} readOnly className="flex-1 font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(link.url, link.magic_token)}
                  >
                    {copiedToken === link.magic_token ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setShowLinksDialog(false)
                router.push("/dashboard")
              }}
            >
              Finalizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
