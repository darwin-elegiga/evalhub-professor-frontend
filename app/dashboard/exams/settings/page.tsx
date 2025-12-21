"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import type { Subject, QuestionTopic, ExamLevel } from "@/lib/types"
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, BookOpen, Tag, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { toast } from "sonner"

const COLORS = [
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "red", label: "Rojo", class: "bg-red-500" },
  { value: "purple", label: "Morado", class: "bg-purple-500" },
  { value: "orange", label: "Naranja", class: "bg-orange-500" },
  { value: "pink", label: "Rosa", class: "bg-pink-500" },
  { value: "indigo", label: "Índigo", class: "bg-indigo-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "cyan", label: "Cian", class: "bg-cyan-500" },
  { value: "emerald", label: "Esmeralda", class: "bg-emerald-500" },
]

export default function ExamSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [levels, setLevels] = useState<ExamLevel[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Dialog states
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [topicDialogOpen, setTopicDialogOpen] = useState(false)
  const [levelDialogOpen, setLevelDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{ type: "subject" | "topic" | "level"; id: string; name: string } | null>(null)

  // Form states
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [editingTopic, setEditingTopic] = useState<QuestionTopic | null>(null)
  const [editingLevel, setEditingLevel] = useState<ExamLevel | null>(null)

  // Form data
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "", color: "blue" })
  const [topicForm, setTopicForm] = useState({ name: "", description: "", color: "blue", subject_id: "" })
  const [levelForm, setLevelForm] = useState({ name: "", description: "" })

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
        setLevels(MOCK_DATA.levels)
      } else {
        // TODO: Implement real API calls
        setSubjects([])
        setTopics([])
        setLevels([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  // Subject handlers
  const openSubjectDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject)
      setSubjectForm({ name: subject.name, description: subject.description || "", color: subject.color })
    } else {
      setEditingSubject(null)
      setSubjectForm({ name: "", description: "", color: "blue" })
    }
    setSubjectDialogOpen(true)
  }

  const saveSubject = () => {
    if (!subjectForm.name.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    if (editingSubject) {
      // Update
      const updated: Subject = {
        ...editingSubject,
        name: subjectForm.name,
        description: subjectForm.description || null,
        color: subjectForm.color,
      }
      setSubjects(subjects.map(s => s.id === updated.id ? updated : s))
      if (USE_MOCK_DATA) {
        const idx = MOCK_DATA.subjects.findIndex(s => s.id === updated.id)
        if (idx >= 0) MOCK_DATA.subjects[idx] = updated
      }
      toast.success("Asignatura actualizada")
    } else {
      // Create
      const newSubject: Subject = {
        id: crypto.randomUUID(),
        teacher_id: user!.id,
        name: subjectForm.name,
        description: subjectForm.description || null,
        color: subjectForm.color,
        created_at: new Date().toISOString(),
      }
      setSubjects([...subjects, newSubject])
      if (USE_MOCK_DATA) {
        MOCK_DATA.subjects.push(newSubject)
      }
      toast.success("Asignatura creada")
    }
    setSubjectDialogOpen(false)
  }

  // Topic handlers
  const openTopicDialog = (topic?: QuestionTopic) => {
    if (topic) {
      setEditingTopic(topic)
      setTopicForm({
        name: topic.name,
        description: topic.description || "",
        color: topic.color,
        subject_id: topic.subject_id
      })
    } else {
      setEditingTopic(null)
      setTopicForm({ name: "", description: "", color: "blue", subject_id: subjects[0]?.id || "" })
    }
    setTopicDialogOpen(true)
  }

  const saveTopic = () => {
    if (!topicForm.name.trim()) {
      toast.error("El nombre es requerido")
      return
    }
    if (!topicForm.subject_id) {
      toast.error("Debes seleccionar una asignatura")
      return
    }

    if (editingTopic) {
      // Update
      const updated: QuestionTopic = {
        ...editingTopic,
        name: topicForm.name,
        description: topicForm.description || null,
        color: topicForm.color,
        subject_id: topicForm.subject_id,
      }
      setTopics(topics.map(t => t.id === updated.id ? updated : t))
      if (USE_MOCK_DATA) {
        const idx = MOCK_DATA.topics.findIndex(t => t.id === updated.id)
        if (idx >= 0) MOCK_DATA.topics[idx] = updated
      }
      toast.success("Tema actualizado")
    } else {
      // Create
      const newTopic: QuestionTopic = {
        id: crypto.randomUUID(),
        teacher_id: user!.id,
        subject_id: topicForm.subject_id,
        name: topicForm.name,
        description: topicForm.description || null,
        color: topicForm.color,
        created_at: new Date().toISOString(),
      }
      setTopics([...topics, newTopic])
      if (USE_MOCK_DATA) {
        MOCK_DATA.topics.push(newTopic)
      }
      toast.success("Tema creado")
    }
    setTopicDialogOpen(false)
  }

  // Level handlers
  const openLevelDialog = (level?: ExamLevel) => {
    if (level) {
      setEditingLevel(level)
      setLevelForm({ name: level.name, description: level.description || "" })
    } else {
      setEditingLevel(null)
      setLevelForm({ name: "", description: "" })
    }
    setLevelDialogOpen(true)
  }

  const saveLevel = () => {
    if (!levelForm.name.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    if (editingLevel) {
      // Update
      const updated: ExamLevel = {
        ...editingLevel,
        name: levelForm.name,
        description: levelForm.description || null,
      }
      setLevels(levels.map(l => l.id === updated.id ? updated : l))
      if (USE_MOCK_DATA) {
        const idx = MOCK_DATA.levels.findIndex(l => l.id === updated.id)
        if (idx >= 0) MOCK_DATA.levels[idx] = updated
      }
      toast.success("Nivel actualizado")
    } else {
      // Create
      const newLevel: ExamLevel = {
        id: crypto.randomUUID(),
        teacher_id: user!.id,
        name: levelForm.name,
        description: levelForm.description || null,
        created_at: new Date().toISOString(),
      }
      setLevels([...levels, newLevel])
      if (USE_MOCK_DATA) {
        MOCK_DATA.levels.push(newLevel)
      }
      toast.success("Nivel creado")
    }
    setLevelDialogOpen(false)
  }

  // Delete handlers
  const confirmDelete = (type: "subject" | "topic" | "level", id: string, name: string) => {
    setDeleteItem({ type, id, name })
    setDeleteDialogOpen(true)
  }

  const executeDelete = () => {
    if (!deleteItem) return

    if (deleteItem.type === "subject") {
      setSubjects(subjects.filter(s => s.id !== deleteItem.id))
      if (USE_MOCK_DATA) {
        const idx = MOCK_DATA.subjects.findIndex(s => s.id === deleteItem.id)
        if (idx >= 0) MOCK_DATA.subjects.splice(idx, 1)
      }
    } else if (deleteItem.type === "topic") {
      setTopics(topics.filter(t => t.id !== deleteItem.id))
      if (USE_MOCK_DATA) {
        const idx = MOCK_DATA.topics.findIndex(t => t.id === deleteItem.id)
        if (idx >= 0) MOCK_DATA.topics.splice(idx, 1)
      }
    } else {
      setLevels(levels.filter(l => l.id !== deleteItem.id))
      if (USE_MOCK_DATA) {
        const idx = MOCK_DATA.levels.findIndex(l => l.id === deleteItem.id)
        if (idx >= 0) MOCK_DATA.levels.splice(idx, 1)
      }
    }

    toast.success("Eliminado correctamente")
    setDeleteDialogOpen(false)
    setDeleteItem(null)
  }

  const getColorClass = (color: string) => {
    return COLORS.find(c => c.value === color)?.class || "bg-gray-500"
  }

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || "Sin asignatura"
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
          <Link href="/dashboard/exams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Exámenes
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-muted-foreground">
            Administra asignaturas, temas y niveles de dificultad
          </p>
        </div>

        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="subjects" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Asignaturas
            </TabsTrigger>
            <TabsTrigger value="topics" className="gap-2">
              <Tag className="h-4 w-4" />
              Temas
            </TabsTrigger>
            <TabsTrigger value="levels" className="gap-2">
              <Layers className="h-4 w-4" />
              Niveles
            </TabsTrigger>
          </TabsList>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Asignaturas</CardTitle>
                  <CardDescription>
                    Materias que enseñas (ej: Física, Matemáticas, Química)
                  </CardDescription>
                </div>
                <Button onClick={() => openSubjectDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Asignatura
                </Button>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay asignaturas. Crea una para comenzar.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-start justify-between rounded-lg border p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-4 w-4 rounded-full mt-1 ${getColorClass(subject.color)}`} />
                          <div>
                            <h3 className="font-medium">{subject.name}</h3>
                            {subject.description && (
                              <p className="text-sm text-muted-foreground">{subject.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {topics.filter(t => t.subject_id === subject.id).length} temas
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openSubjectDialog(subject)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete("subject", subject.id, subject.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Temas</CardTitle>
                  <CardDescription>
                    Temas específicos dentro de cada asignatura
                  </CardDescription>
                </div>
                <Button onClick={() => openTopicDialog()} disabled={subjects.length === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Tema
                </Button>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Primero debes crear una asignatura.
                  </div>
                ) : topics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay temas. Crea uno para comenzar.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {subjects.map((subject) => {
                      const subjectTopics = topics.filter(t => t.subject_id === subject.id)
                      if (subjectTopics.length === 0) return null

                      return (
                        <div key={subject.id}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`h-3 w-3 rounded-full ${getColorClass(subject.color)}`} />
                            <h3 className="font-medium text-sm text-muted-foreground">{subject.name}</h3>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pl-5">
                            {subjectTopics.map((topic) => (
                              <div
                                key={topic.id}
                                className="flex items-start justify-between rounded-lg border p-3 hover:bg-gray-50"
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`h-3 w-3 rounded-full mt-1 ${getColorClass(topic.color)}`} />
                                  <div>
                                    <h4 className="font-medium text-sm">{topic.name}</h4>
                                    {topic.description && (
                                      <p className="text-xs text-muted-foreground">{topic.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openTopicDialog(topic)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => confirmDelete("topic", topic.id, topic.name)}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Levels Tab */}
          <TabsContent value="levels">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Niveles de Dificultad</CardTitle>
                  <CardDescription>
                    Niveles para clasificar exámenes (ej: Básico, Intermedio, Avanzado)
                  </CardDescription>
                </div>
                <Button onClick={() => openLevelDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Nivel
                </Button>
              </CardHeader>
              <CardContent>
                {levels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay niveles. Crea uno para comenzar.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {levels.map((level) => (
                      <div
                        key={level.id}
                        className="flex items-start justify-between rounded-lg border p-4 hover:bg-gray-50"
                      >
                        <div>
                          <h3 className="font-medium">{level.name}</h3>
                          {level.description && (
                            <p className="text-sm text-muted-foreground">{level.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openLevelDialog(level)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete("level", level.id, level.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Editar Asignatura" : "Nueva Asignatura"}</DialogTitle>
            <DialogDescription>
              {editingSubject ? "Modifica los datos de la asignatura" : "Crea una nueva asignatura"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Nombre</Label>
              <Input
                id="subject-name"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="Ej: Física"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-desc">Descripción (opcional)</Label>
              <Textarea
                id="subject-desc"
                value={subjectForm.description}
                onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                placeholder="Descripción breve..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-8 w-8 rounded-full ${color.class} ${
                      subjectForm.color === color.value ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                    onClick={() => setSubjectForm({ ...subjectForm, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSubject}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topic Dialog */}
      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Editar Tema" : "Nuevo Tema"}</DialogTitle>
            <DialogDescription>
              {editingTopic ? "Modifica los datos del tema" : "Crea un nuevo tema para una asignatura"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asignatura</Label>
              <Select
                value={topicForm.subject_id}
                onValueChange={(value) => setTopicForm({ ...topicForm, subject_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getColorClass(subject.color)}`} />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-name">Nombre</Label>
              <Input
                id="topic-name"
                value={topicForm.name}
                onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                placeholder="Ej: Cinemática"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-desc">Descripción (opcional)</Label>
              <Textarea
                id="topic-desc"
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                placeholder="Descripción breve..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-8 w-8 rounded-full ${color.class} ${
                      topicForm.color === color.value ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                    onClick={() => setTopicForm({ ...topicForm, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTopic}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Dialog */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLevel ? "Editar Nivel" : "Nuevo Nivel"}</DialogTitle>
            <DialogDescription>
              {editingLevel ? "Modifica los datos del nivel" : "Crea un nuevo nivel de dificultad"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="level-name">Nombre</Label>
              <Input
                id="level-name"
                value={levelForm.name}
                onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                placeholder="Ej: Intermedio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level-desc">Descripción (opcional)</Label>
              <Textarea
                id="level-desc"
                value={levelForm.description}
                onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
                placeholder="Descripción breve..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLevelDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveLevel}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {deleteItem?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
              {deleteItem?.type === "subject" && " Los temas asociados no serán eliminados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
