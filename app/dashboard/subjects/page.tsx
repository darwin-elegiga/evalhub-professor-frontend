"use client"

import { useAuth } from "@/lib/auth-context"
import { useHeaderActions } from "@/lib/header-actions-context"
import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { USE_MOCK_DATA, MOCK_DATA } from "@/lib/mock-data"
import type { Subject, QuestionTopic } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
import {
  BookOpen,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  Plus,
  Tag,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

interface SubjectForm {
  name: string
  description: string
  color: string
}

interface TopicForm {
  name: string
  description: string
  color: string
}

const INITIAL_SUBJECT_FORM: SubjectForm = {
  name: "",
  description: "",
  color: "blue",
}

const INITIAL_TOPIC_FORM: TopicForm = {
  name: "",
  description: "",
  color: "blue",
}

const COLORS = [
  { value: "blue", label: "Azul", bg: "bg-blue-500", ring: "ring-blue-500", text: "text-blue-700", bgLight: "bg-blue-100" },
  { value: "green", label: "Verde", bg: "bg-green-500", ring: "ring-green-500", text: "text-green-700", bgLight: "bg-green-100" },
  { value: "red", label: "Rojo", bg: "bg-red-500", ring: "ring-red-500", text: "text-red-700", bgLight: "bg-red-100" },
  { value: "purple", label: "Morado", bg: "bg-purple-500", ring: "ring-purple-500", text: "text-purple-700", bgLight: "bg-purple-100" },
  { value: "orange", label: "Naranja", bg: "bg-orange-500", ring: "ring-orange-500", text: "text-orange-700", bgLight: "bg-orange-100" },
  { value: "pink", label: "Rosa", bg: "bg-pink-500", ring: "ring-pink-500", text: "text-pink-700", bgLight: "bg-pink-100" },
  { value: "cyan", label: "Cian", bg: "bg-cyan-500", ring: "ring-cyan-500", text: "text-cyan-700", bgLight: "bg-cyan-100" },
  { value: "yellow", label: "Amarillo", bg: "bg-yellow-500", ring: "ring-yellow-500", text: "text-yellow-700", bgLight: "bg-yellow-100" },
  { value: "indigo", label: "Índigo", bg: "bg-indigo-500", ring: "ring-indigo-500", text: "text-indigo-700", bgLight: "bg-indigo-100" },
  { value: "teal", label: "Teal", bg: "bg-teal-500", ring: "ring-teal-500", text: "text-teal-700", bgLight: "bg-teal-100" },
]

const getColorClasses = (color: string) => {
  const found = COLORS.find((c) => c.value === color)
  return found || COLORS[0]
}

// Helper to transform snake_case to camelCase for subjects
const transformSubject = (s: any): Subject => ({
  id: s.id,
  name: s.name,
  description: s.description,
  color: s.color,
  createdAt: s.createdAt || s.created_at,
  updatedAt: s.updatedAt || s.updated_at || s.createdAt || s.created_at,
})

// Helper to transform snake_case to camelCase for topics
const transformTopic = (t: any): QuestionTopic => ({
  id: t.id,
  teacherId: t.teacherId || t.teacher_id,
  subjectId: t.subjectId || t.subject_id,
  name: t.name,
  description: t.description,
  color: t.color,
  createdAt: t.createdAt || t.created_at,
})

export default function SubjectsPage() {
  const { user } = useAuth()
  const { setActions, clearActions } = useHeaderActions()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())

  // Subject modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [subjectForm, setSubjectForm] = useState<SubjectForm>(INITIAL_SUBJECT_FORM)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false)
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null)

  // Topic modal state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [topicForm, setTopicForm] = useState<TopicForm>(INITIAL_TOPIC_FORM)
  const [editingTopic, setEditingTopic] = useState<QuestionTopic | null>(null)
  const [topicSubjectId, setTopicSubjectId] = useState<string | null>(null)
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false)
  const [topicFormError, setTopicFormError] = useState<string | null>(null)

  // Delete confirmation
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null)
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Group topics by subject
  const topicsBySubject = useMemo(() => {
    const grouped: Record<string, QuestionTopic[]> = {}
    topics.forEach((topic) => {
      if (topic.subjectId) {
        if (!grouped[topic.subjectId]) {
          grouped[topic.subjectId] = []
        }
        grouped[topic.subjectId].push(topic)
      }
    })
    return grouped
  }, [topics])

  // Header actions
  const openCreateSubjectModal = useCallback(() => {
    setEditingSubject(null)
    setSubjectForm(INITIAL_SUBJECT_FORM)
    setSubjectFormError(null)
    setIsSubjectModalOpen(true)
  }, [])

  useEffect(() => {
    setActions([{ label: "Nueva Asignatura", onClick: openCreateSubjectModal }])
    return () => clearActions()
  }, [setActions, clearActions, openCreateSubjectModal])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      if (USE_MOCK_DATA) {
        setSubjects(MOCK_DATA.subjects.map(transformSubject))
        setTopics(MOCK_DATA.topics.map(transformTopic))
      } else {
        try {
          const [subjectsData, topicsData] = await Promise.all([
            apiClient.get<Subject[]>(API_CONFIG.ENDPOINTS.SUBJECTS),
            apiClient.get<QuestionTopic[]>(API_CONFIG.ENDPOINTS.TOPICS),
          ])
          setSubjects(subjectsData.map(transformSubject))
          setTopics(topicsData.map(transformTopic))
        } catch (apiError) {
          // Fallback to mock data if API fails
          console.warn("Error loading from API, using mock data as fallback:", apiError)
          setSubjects(MOCK_DATA.subjects.map(transformSubject))
          setTopics(MOCK_DATA.topics.map(transformTopic))
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSubjectExpanded = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev)
      if (next.has(subjectId)) {
        next.delete(subjectId)
      } else {
        next.add(subjectId)
      }
      return next
    })
  }

  // Subject handlers
  const openEditSubjectModal = (subject: Subject) => {
    setEditingSubject(subject)
    setSubjectForm({
      name: subject.name,
      description: subject.description || "",
      color: subject.color,
    })
    setSubjectFormError(null)
    setIsSubjectModalOpen(true)
  }

  const handleSubmitSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubjectFormError(null)

    if (!subjectForm.name.trim()) {
      setSubjectFormError("El nombre es obligatorio")
      return
    }

    setIsSubmittingSubject(true)

    try {
      const payload = {
        name: subjectForm.name.trim(),
        description: subjectForm.description.trim() || null,
        color: subjectForm.color,
      }

      if (editingSubject) {
        if (USE_MOCK_DATA) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === editingSubject.id
                ? { ...s, ...payload, updatedAt: new Date().toISOString() }
                : s
            )
          )
        } else {
          const updated = await apiClient.put<Subject>(
            API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(editingSubject.id),
            payload
          )
          setSubjects((prev) =>
            prev.map((s) => (s.id === editingSubject.id ? transformSubject(updated) : s))
          )
        }
      } else {
        if (USE_MOCK_DATA) {
          const newSubject: Subject = {
            id: crypto.randomUUID(),
            name: payload.name,
            description: payload.description,
            color: payload.color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setSubjects((prev) => [...prev, newSubject])
        } else {
          const newSubject = await apiClient.post<Subject>(
            API_CONFIG.ENDPOINTS.SUBJECTS,
            payload
          )
          setSubjects((prev) => [...prev, transformSubject(newSubject)])
        }
      }

      setIsSubjectModalOpen(false)
      setSubjectForm(INITIAL_SUBJECT_FORM)
      setEditingSubject(null)
    } catch (error) {
      setSubjectFormError(error instanceof Error ? error.message : "Error al guardar asignatura")
    } finally {
      setIsSubmittingSubject(false)
    }
  }

  const handleDeleteSubject = async () => {
    if (!deleteSubjectId) return
    setIsDeleting(true)

    try {
      if (USE_MOCK_DATA) {
        setSubjects((prev) => prev.filter((s) => s.id !== deleteSubjectId))
        // Also remove topics associated with this subject
        setTopics((prev) => prev.filter((t) => t.subjectId !== deleteSubjectId))
      } else {
        await apiClient.delete(API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(deleteSubjectId))
        setSubjects((prev) => prev.filter((s) => s.id !== deleteSubjectId))
        setTopics((prev) => prev.filter((t) => t.subjectId !== deleteSubjectId))
      }
      setDeleteSubjectId(null)
    } catch (error) {
      console.error("Error deleting subject:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Topic handlers
  const openCreateTopicModal = (subjectId: string) => {
    setEditingTopic(null)
    setTopicSubjectId(subjectId)
    setTopicForm(INITIAL_TOPIC_FORM)
    setTopicFormError(null)
    setIsTopicModalOpen(true)
  }

  const openEditTopicModal = (topic: QuestionTopic) => {
    setEditingTopic(topic)
    setTopicSubjectId(topic.subjectId)
    setTopicForm({
      name: topic.name,
      description: topic.description || "",
      color: topic.color,
    })
    setTopicFormError(null)
    setIsTopicModalOpen(true)
  }

  const handleSubmitTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    setTopicFormError(null)

    if (!topicForm.name.trim()) {
      setTopicFormError("El nombre es obligatorio")
      return
    }

    if (!topicSubjectId) {
      setTopicFormError("Error: No se ha seleccionado la asignatura")
      return
    }

    setIsSubmittingTopic(true)

    try {
      const payload = {
        name: topicForm.name.trim(),
        description: topicForm.description.trim() || null,
        color: topicForm.color,
        subjectId: topicSubjectId,
      }

      if (editingTopic) {
        if (USE_MOCK_DATA) {
          setTopics((prev) =>
            prev.map((t) =>
              t.id === editingTopic.id
                ? { ...t, name: payload.name, description: payload.description, color: payload.color }
                : t
            )
          )
        } else {
          const updated = await apiClient.put<QuestionTopic>(
            API_CONFIG.ENDPOINTS.TOPIC_BY_ID(editingTopic.id),
            payload
          )
          setTopics((prev) =>
            prev.map((t) => (t.id === editingTopic.id ? transformTopic(updated) : t))
          )
        }
      } else {
        if (USE_MOCK_DATA) {
          const newTopic: QuestionTopic = {
            id: crypto.randomUUID(),
            teacherId: user?.id || "1",
            subjectId: topicSubjectId,
            name: payload.name,
            description: payload.description,
            color: payload.color,
            createdAt: new Date().toISOString(),
          }
          setTopics((prev) => [...prev, newTopic])
        } else {
          const newTopic = await apiClient.post<QuestionTopic>(
            API_CONFIG.ENDPOINTS.TOPICS,
            payload
          )
          setTopics((prev) => [...prev, transformTopic(newTopic)])
        }
      }

      setIsTopicModalOpen(false)
      setTopicForm(INITIAL_TOPIC_FORM)
      setEditingTopic(null)
      setTopicSubjectId(null)
    } catch (error) {
      setTopicFormError(error instanceof Error ? error.message : "Error al guardar tema")
    } finally {
      setIsSubmittingTopic(false)
    }
  }

  const handleDeleteTopic = async () => {
    if (!deleteTopicId) return
    setIsDeleting(true)

    try {
      if (USE_MOCK_DATA) {
        setTopics((prev) => prev.filter((t) => t.id !== deleteTopicId))
      } else {
        await apiClient.delete(API_CONFIG.ENDPOINTS.TOPIC_BY_ID(deleteTopicId))
        setTopics((prev) => prev.filter((t) => t.id !== deleteTopicId))
      }
      setDeleteTopicId(null)
    } catch (error) {
      console.error("Error deleting topic:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando asignaturas...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{subjects.length}</p>
                <p className="text-sm text-gray-500">Asignaturas</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{topics.length}</p>
                <p className="text-sm text-gray-500">Temas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subject List */}
        {subjects.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-64 flex-col items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">
                No hay asignaturas
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Crea tu primera asignatura para organizar tus preguntas y exámenes
              </p>
              <Button onClick={openCreateSubjectModal}>Nueva Asignatura</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject) => {
              const colorClass = getColorClasses(subject.color)
              const subjectTopics = topicsBySubject[subject.id] || []
              const isExpanded = expandedSubjects.has(subject.id)

              return (
                <div
                  key={subject.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  {/* Subject Header */}
                  <div
                    className={`border-l-4 ${colorClass.bg.replace("bg-", "border-")}`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleSubjectExpanded(subject.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-500" />
                            )}
                          </button>
                          <div
                            className={`h-4 w-4 rounded-full ${colorClass.bg}`}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {subject.name}
                            </h3>
                            {subject.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {subject.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {subjectTopics.length} tema{subjectTopics.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => openCreateTopicModal(subject.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Agregar tema"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditSubjectModal(subject)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Editar asignatura"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteSubjectId(subject.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar asignatura"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Topics List (collapsible) */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      {subjectTopics.length === 0 ? (
                        <div className="text-center py-6">
                          <Tag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-3">
                            No hay temas en esta asignatura
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCreateTopicModal(subject.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar Tema
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">Temas</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCreateTopicModal(subject.id)}
                              className="h-8"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar
                            </Button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {subjectTopics.map((topic) => {
                              const topicColor = getColorClasses(topic.color)
                              return (
                                <div
                                  key={topic.id}
                                  className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`h-3 w-3 rounded-full ${topicColor.bg}`}
                                    />
                                    <span className="text-sm font-medium text-gray-800 truncate">
                                      {topic.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditTopicModal(topic)}
                                      className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTopicId(topic.id)}
                                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Subject Modal */}
      <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "Editar asignatura" : "Nueva asignatura"}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? "Modifica los datos de la asignatura"
                : "Ingresa los datos de la nueva asignatura"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitSubject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Nombre *</Label>
              <Input
                id="subject-name"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Física, Matemáticas..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-description">Descripción</Label>
              <Textarea
                id="subject-description"
                value={subjectForm.description}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional de la asignatura"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSubjectForm((prev) => ({ ...prev, color: color.value }))}
                    className={`h-8 w-8 rounded-full ${color.bg} transition-all ${
                      subjectForm.color === color.value
                        ? `ring-2 ${color.ring} ring-offset-2`
                        : "hover:scale-110"
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            {subjectFormError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {subjectFormError}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubjectModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingSubject}>
                {isSubmittingSubject ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingSubject ? "Guardando..." : "Creando..."}
                  </>
                ) : editingSubject ? (
                  "Guardar cambios"
                ) : (
                  "Crear asignatura"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Topic Modal */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? "Editar tema" : "Nuevo tema"}
            </DialogTitle>
            <DialogDescription>
              {editingTopic
                ? "Modifica los datos del tema"
                : "Ingresa los datos del nuevo tema"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTopic} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Nombre *</Label>
              <Input
                id="topic-name"
                value={topicForm.name}
                onChange={(e) => setTopicForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Cinemática, Álgebra..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-description">Descripción</Label>
              <Textarea
                id="topic-description"
                value={topicForm.description}
                onChange={(e) => setTopicForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional del tema"
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
                    onClick={() => setTopicForm((prev) => ({ ...prev, color: color.value }))}
                    className={`h-8 w-8 rounded-full ${color.bg} transition-all ${
                      topicForm.color === color.value
                        ? `ring-2 ${color.ring} ring-offset-2`
                        : "hover:scale-110"
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            {topicFormError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {topicFormError}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTopicModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingTopic}>
                {isSubmittingTopic ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingTopic ? "Guardando..." : "Creando..."}
                  </>
                ) : editingTopic ? (
                  "Guardar cambios"
                ) : (
                  "Crear tema"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation */}
      <AlertDialog
        open={!!deleteSubjectId}
        onOpenChange={(open) => !open && setDeleteSubjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar asignatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también todos los
              temas asociados a esta asignatura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Topic Confirmation */}
      <AlertDialog
        open={!!deleteTopicId}
        onOpenChange={(open) => !open && setDeleteTopicId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tema?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las preguntas asociadas a este
              tema no serán eliminadas pero perderán la referencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
