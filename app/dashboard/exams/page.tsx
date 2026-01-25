"use client"

import { useAuth } from "@/lib/auth-context"
import { authFetch } from "@/lib/api-client"
import { useEffect, useState, useMemo } from "react"
import type { Exam, Subject } from "@/lib/types"
import { Plus, ChevronRight, Search, X, Settings, Clock, FileQuestion, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function ExamsPage() {
  const { user } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingExams, setLoadingExams] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        authFetch("/api/exams"),
        authFetch("/api/subjects"),
      ])
      const [examsData, subjectsData] = await Promise.all([
        examsRes.json(),
        subjectsRes.json(),
      ])
      setExams(Array.isArray(examsData) ? examsData : [])
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
    } catch (error) {
      console.error("Error loading exams:", error)
    } finally {
      setLoadingExams(false)
    }
  }

  const getSubjectById = (id: string | null) => {
    if (!id) return null
    return subjects.find((s) => s.id === id)
  }

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesTitle = exam.title.toLowerCase().includes(searchLower)
        const matchesDescription = exam.description?.toLowerCase().includes(searchLower)
        if (!matchesTitle && !matchesDescription) return false
      }

      // Subject filter
      if (subjectFilter !== "all" && exam.subjectId !== subjectFilter) return false

      return true
    })
  }, [exams, search, subjectFilter])

  const hasActiveFilters = search || subjectFilter !== "all"

  const clearFilters = () => {
    setSearch("")
    setSubjectFilter("all")
  }

  if (loadingExams) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando exámenes...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Filters */}
        {exams.length > 0 && (
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por título o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-gray-200"
              />
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[180px] bg-white border-gray-200 text-sm">
                  <SelectValue placeholder="Asignatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las asignaturas</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>

            {/* Results count */}
            {hasActiveFilters && (
              <p className="text-sm text-gray-500">
                {filteredExams.length} de {exams.length} exámenes
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/dashboard/exams/create">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Examen
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/exams/assignments">
                <ClipboardList className="mr-2 h-4 w-4" />
                Asignaciones
              </Link>
            </Button>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/exams/settings">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Link>
          </Button>
        </div>

        {/* Empty state */}
        {exams.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-64 flex-col items-center justify-center">
              <p className="mb-4 text-muted-foreground">
                No tienes exámenes creados todavía
              </p>
              <Button asChild>
                <Link href="/dashboard/exams/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear tu primer examen
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : filteredExams.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              No se encontraron exámenes con estos filtros
            </p>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white overflow-hidden">
            {filteredExams.map((exam) => {
              const subject = getSubjectById(exam.subjectId)

              return (
                <Link
                  key={exam.id}
                  href={`/dashboard/exams/${exam.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                    <FileQuestion className="h-5 w-5 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {exam.title}
                      </h3>
                      {subject && (
                        <Badge variant="secondary" className="text-xs">
                          {subject.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {exam.description || "Sin descripción"}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 shrink-0 text-sm text-gray-500">
                    {exam.durationMinutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{exam.durationMinutes} min</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(exam.createdAt).toLocaleDateString()}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
