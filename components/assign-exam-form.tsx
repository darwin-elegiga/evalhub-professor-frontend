"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Exam, Student, StudentGroup } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Send, Copy, Check, Users, GraduationCap, Building } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface AssignExamFormProps {
  exam: Exam
  students: Student[]
  groups: StudentGroup[]
}

interface MagicLink {
  student_id: string
  student_name: string
  magic_token: string
  url: string
}

export function AssignExamForm({ exam, students, groups }: AssignExamFormProps) {
  const router = useRouter()

  // Cascade selection state
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")

  // Student selection
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinks, setMagicLinks] = useState<MagicLink[]>([])
  const [showLinksDialog, setShowLinksDialog] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Get unique careers from groups
  const careers = useMemo(() => {
    const uniqueCareers = [...new Set(groups.map((g) => g.career))]
    return uniqueCareers.sort()
  }, [groups])

  // Filter groups by selected career
  const filteredGroups = useMemo(() => {
    if (!selectedCareer) return []
    return groups.filter((g) => g.career === selectedCareer)
  }, [groups, selectedCareer])

  // Filter students by selected group
  const filteredStudents = useMemo(() => {
    if (!selectedGroupId) return []
    return students.filter((s) => s.group_id === selectedGroupId)
  }, [students, selectedGroupId])

  // Handle career change
  const handleCareerChange = (career: string) => {
    setSelectedCareer(career)
    setSelectedGroupId("")
    setSelectedStudents([])
  }

  // Handle group change
  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId)
    setSelectedStudents([])
  }

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id))
    }
  }

  const copyToClipboard = async (text: string, token: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const copyAllLinks = async () => {
    const allLinks = magicLinks
      .map((link) => `${link.student_name}: ${link.url}`)
      .join("\n")
    await navigator.clipboard.writeText(allLinks)
    toast.success("Todos los enlaces copiados")
  }

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Selecciona al menos un estudiante")
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
          group_id: selectedGroupId,
        }),
      })

      if (!response.ok) throw new Error("Error assigning exam")

      const data = await response.json()
      setMagicLinks(data.assignments)
      setShowLinksDialog(true)
      toast.success(`Examen asignado a ${selectedStudents.length} estudiante(s)`)
    } catch (error) {
      console.error("Error assigning exam:", error)
      toast.error("Error al asignar el examen")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

  return (
    <>
      <div className="space-y-6 mx-auto max-w-3xl">
        {/* Step 1: Select Career */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <CardTitle className="text-lg">Seleccionar Carrera</CardTitle>
                <CardDescription>Elige la carrera de los estudiantes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Select value={selectedCareer} onValueChange={handleCareerChange}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecciona una carrera" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {careers.map((career) => (
                  <SelectItem key={career} value={career}>
                    {career}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Step 2: Select Group */}
        <Card className={!selectedCareer ? "opacity-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                selectedCareer ? "bg-primary text-primary-foreground" : "bg-gray-200 text-gray-500"
              }`}>
                2
              </div>
              <div>
                <CardTitle className="text-lg">Seleccionar Grupo</CardTitle>
                <CardDescription>
                  {selectedCareer
                    ? `${filteredGroups.length} grupo(s) disponible(s)`
                    : "Primero selecciona una carrera"
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedGroupId}
              onValueChange={handleGroupChange}
              disabled={!selectedCareer}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecciona un grupo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {filteredGroups.map((group) => {
                  const studentCount = students.filter((s) => s.group_id === group.id).length
                  return (
                    <SelectItem key={group.id} value={group.id}>
                      <span className="flex items-center gap-2">
                        {group.name}
                        <span className="text-xs text-muted-foreground">
                          ({studentCount} estudiantes)
                        </span>
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Step 3: Select Students */}
        <Card className={!selectedGroupId ? "opacity-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                selectedGroupId ? "bg-primary text-primary-foreground" : "bg-gray-200 text-gray-500"
              }`}>
                3
              </div>
              <div>
                <CardTitle className="text-lg">Seleccionar Estudiantes</CardTitle>
                <CardDescription>
                  {selectedGroupId
                    ? `${selectedStudents.length} de ${filteredStudents.length} seleccionado(s)`
                    : "Primero selecciona un grupo"
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedGroupId ? (
              <>
                {/* Group info bar */}
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedGroup?.name}</span>
                    <span className="text-sm text-muted-foreground">
                      · {selectedGroup?.career}
                    </span>
                  </div>
                </div>

                {/* Select all */}
                <div className="flex items-center gap-2 border-b pb-3">
                  <Checkbox
                    id="select-all"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <Label htmlFor="select-all" className="font-medium cursor-pointer">
                    Seleccionar todos ({filteredStudents.length})
                  </Label>
                </div>

                {/* Student list */}
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                      <p className="text-sm text-muted-foreground">No hay estudiantes en este grupo</p>
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                          selectedStudents.includes(student.id)
                            ? "border-primary bg-primary/5"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => toggleStudent(student.id)}
                      >
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
              </>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">Selecciona una carrera y grupo primero</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading || selectedStudents.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? "Generando enlaces..." : `Asignar a ${selectedStudents.length} estudiante(s)`}
          </Button>
        </div>
      </div>

      {/* Magic Links Dialog */}
      <Dialog open={showLinksDialog} onOpenChange={setShowLinksDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Magic Links Generados</DialogTitle>
            <DialogDescription>
              Cada estudiante tiene un enlace único para acceder al examen. Compártelos de forma segura.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={copyAllLinks}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar todos
            </Button>
          </div>

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
                router.push("/dashboard/exams")
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
