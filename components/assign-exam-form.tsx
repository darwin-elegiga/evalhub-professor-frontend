"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Send, Copy, Check, Users, GraduationCap, Building, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { USE_MOCK_DATA, MOCK_DATA } from "@/lib/mock-data"

interface AssignExamFormProps {
  exam: Exam
  groups: StudentGroup[]
}

interface MagicLink {
  studentId: string
  studentName: string
  magicToken: string
  magicLink: string
}

export function AssignExamForm({ exam, groups }: AssignExamFormProps) {
  const router = useRouter()

  // Cascade selection state
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")

  // Students fetched from selected group
  const [groupStudents, setGroupStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Student selection
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinks, setMagicLinks] = useState<MagicLink[]>([])
  const [showLinksDialog, setShowLinksDialog] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Get unique careers from groups
  const careers = useMemo(() => {
    const uniqueCareers = [...new Set(groups.filter((g) => g.career).map((g) => g.career))]
    return uniqueCareers.sort()
  }, [groups])

  // Filter groups by selected career
  const filteredGroups = useMemo(() => {
    if (!selectedCareer) return []
    return groups.filter((g) => g.career === selectedCareer)
  }, [groups, selectedCareer])

  // Load students when group is selected
  useEffect(() => {
    if (selectedGroupId) {
      loadGroupStudents(selectedGroupId)
    } else {
      setGroupStudents([])
    }
  }, [selectedGroupId])

  const loadGroupStudents = async (groupId: string) => {
    setLoadingStudents(true)
    try {
      if (USE_MOCK_DATA) {
        // Filter mock students by group
        const students = MOCK_DATA.students.filter((s) =>
          s.groups?.some((g) => g.id === groupId)
        )
        setGroupStudents(students)
      } else {
        // Fetch students from backend using the group endpoint
        const students = await apiClient.get<Student[]>(
          API_CONFIG.ENDPOINTS.GROUP_STUDENTS(groupId)
        )
        setGroupStudents(students)
      }
    } catch (error) {
      console.error("Error loading group students:", error)
      toast.error("Error al cargar estudiantes del grupo")
      setGroupStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  // Handle career change
  const handleCareerChange = (career: string) => {
    setSelectedCareer(career)
    setSelectedGroupId("")
    setSelectedStudents([])
    setGroupStudents([])
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
    if (selectedStudents.length === groupStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(groupStudents.map((s) => s.id))
    }
  }

  const copyToClipboard = async (text: string, token: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const copyAllLinks = async () => {
    const allLinks = magicLinks
      .map((link) => `${link.studentName}: ${link.magicLink}`)
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
      // Call backend directly with apiClient
      const data = await apiClient.post<{
        assignments: Array<{
          studentId: string
          studentName: string
          studentEmail: string
          magicToken: string
          magicLink: string
        }>
        skippedCount: number
      }>(API_CONFIG.ENDPOINTS.EXAMS_ASSIGN, {
        examId: exam.id,
        studentIds: selectedStudents,
      })

      // Transform to our MagicLink format
      const links: MagicLink[] = data.assignments.map((a) => ({
        studentId: a.studentId,
        studentName: a.studentName,
        magicToken: a.magicToken,
        magicLink: a.magicLink,
      }))

      setMagicLinks(links)
      setShowLinksDialog(true)

      if (data.skippedCount > 0) {
        toast.success(
          `Examen asignado a ${data.assignments.length} estudiante(s). ${data.skippedCount} ya tenían asignación.`
        )
      } else {
        toast.success(`Examen asignado a ${data.assignments.length} estudiante(s)`)
      }
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
                {filteredGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
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
                    ? loadingStudents
                      ? "Cargando estudiantes..."
                      : `${selectedStudents.length} de ${groupStudents.length} seleccionado(s)`
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

                {loadingStudents ? (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Select all */}
                    <div className="flex items-center gap-2 border-b pb-3">
                      <Checkbox
                        id="select-all"
                        checked={selectedStudents.length === groupStudents.length && groupStudents.length > 0}
                        onCheckedChange={toggleAll}
                      />
                      <Label htmlFor="select-all" className="font-medium cursor-pointer">
                        Seleccionar todos ({groupStudents.length})
                      </Label>
                    </div>

                    {/* Student list */}
                    <div className="max-h-72 space-y-1 overflow-y-auto">
                      {groupStudents.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                          <p className="text-sm text-muted-foreground">No hay estudiantes en este grupo</p>
                        </div>
                      ) : (
                        groupStudents.map((student) => (
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
                              <div className="font-medium">{student.fullName}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
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
              <div key={link.studentId} className="rounded-md border p-4">
                <div className="mb-2 font-medium">{link.studentName}</div>
                <div className="flex gap-2">
                  <Input value={link.magicLink} readOnly className="flex-1 font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(link.magicLink, link.magicToken)}
                  >
                    {copiedToken === link.magicToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
