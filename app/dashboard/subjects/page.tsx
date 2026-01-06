"use client"

import { useAuth } from "@/lib/auth-context"
import { useHeaderActions } from "@/lib/header-actions-context"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { USE_MOCK_DATA } from "@/lib/mock-data"
import type { Subject } from "@/lib/types"
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
} from "lucide-react"

interface SubjectForm {
  name: string
  description: string
  color: string
}

const INITIAL_FORM: SubjectForm = {
  name: "",
  description: "",
  color: "blue",
}

const COLORS = [
  { value: "blue", label: "Azul", bg: "bg-blue-500", ring: "ring-blue-500" },
  { value: "green", label: "Verde", bg: "bg-green-500", ring: "ring-green-500" },
  { value: "red", label: "Rojo", bg: "bg-red-500", ring: "ring-red-500" },
  { value: "purple", label: "Morado", bg: "bg-purple-500", ring: "ring-purple-500" },
  { value: "orange", label: "Naranja", bg: "bg-orange-500", ring: "ring-orange-500" },
  { value: "pink", label: "Rosa", bg: "bg-pink-500", ring: "ring-pink-500" },
  { value: "cyan", label: "Cian", bg: "bg-cyan-500", ring: "ring-cyan-500" },
  { value: "yellow", label: "Amarillo", bg: "bg-yellow-500", ring: "ring-yellow-500" },
  { value: "indigo", label: "Índigo", bg: "bg-indigo-500", ring: "ring-indigo-500" },
  { value: "teal", label: "Teal", bg: "bg-teal-500", ring: "ring-teal-500" },
]

const getColorClasses = (color: string) => {
  const found = COLORS.find((c) => c.value === color)
  return found || COLORS[0]
}

export default function SubjectsPage() {
  const { user } = useAuth()
  const { setActions, clearActions } = useHeaderActions()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<SubjectForm>(INITIAL_FORM)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete confirmation
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Header actions
  const openCreateModal = useCallback(() => {
    setEditingSubject(null)
    setForm(INITIAL_FORM)
    setFormError(null)
    setIsModalOpen(true)
  }, [])

  useEffect(() => {
    setActions([{ label: "Nueva Asignatura", onClick: openCreateModal }])
    return () => clearActions()
  }, [setActions, clearActions, openCreateModal])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      if (USE_MOCK_DATA) {
        setSubjects([
          {
            id: "1",
            name: "Física",
            description: "Física general y mecánica clásica",
            color: "blue",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Matemáticas",
            description: "Cálculo diferencial e integral",
            color: "green",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
      } else {
        const data = await apiClient.get<Subject[]>(API_CONFIG.ENDPOINTS.SUBJECTS)
        setSubjects(data)
      }
    } catch (error) {
      console.error("Error loading subjects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject)
    setForm({
      name: subject.name,
      description: subject.description || "",
      color: subject.color,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.name.trim()) {
      setFormError("El nombre es obligatorio")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        color: form.color,
      }

      if (editingSubject) {
        if (USE_MOCK_DATA) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === editingSubject.id ? { ...s, ...payload } : s
            )
          )
        } else {
          const updated = await apiClient.put<Subject>(
            API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(editingSubject.id),
            payload
          )
          setSubjects((prev) =>
            prev.map((s) => (s.id === editingSubject.id ? updated : s))
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
          setSubjects((prev) => [...prev, newSubject])
        }
      }

      setIsModalOpen(false)
      setForm(INITIAL_FORM)
      setEditingSubject(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Error al guardar asignatura")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteSubjectId) return
    setIsDeleting(true)

    try {
      if (USE_MOCK_DATA) {
        setSubjects((prev) => prev.filter((s) => s.id !== deleteSubjectId))
      } else {
        await apiClient.delete(API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(deleteSubjectId))
        setSubjects((prev) => prev.filter((s) => s.id !== deleteSubjectId))
      }
      setDeleteSubjectId(null)
    } catch (error) {
      console.error("Error deleting subject:", error)
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
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{subjects.length}</p>
              <p className="text-sm text-gray-500">Total asignaturas</p>
            </div>
          </div>
        </div>

        {/* Subject Grid */}
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
              <Button onClick={openCreateModal}>Nueva Asignatura</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const colorClass = getColorClasses(subject.color)
              return (
                <div
                  key={subject.id}
                  className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  {/* Color indicator */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${colorClass.bg}`}
                  />

                  <div className="flex items-start justify-between gap-3 pt-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${colorClass.bg}`}
                        />
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {subject.name}
                        </h3>
                      </div>
                      {subject.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {subject.description}
                        </p>
                      )}
                      <p className="mt-3 text-xs text-gray-400">
                        Creada el{" "}
                        {new Date(subject.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(subject)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteSubjectId(subject.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Física, Matemáticas..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
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
                    onClick={() => setForm((prev) => ({ ...prev, color: color.value }))}
                    className={`h-8 w-8 rounded-full ${color.bg} transition-all ${
                      form.color === color.value
                        ? `ring-2 ${color.ring} ring-offset-2`
                        : "hover:scale-110"
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteSubjectId}
        onOpenChange={(open) => !open && setDeleteSubjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar asignatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también las
              asociaciones con preguntas y temas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
