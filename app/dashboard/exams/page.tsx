"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState, useMemo } from "react"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Exam, ExamAssignment, StudentGroup } from "@/lib/types"
import { Plus, ChevronRight, Search, X } from "lucide-react"
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
import Link from "next/link"

interface ExamAssignmentWithStats extends ExamAssignment {
  exam: Exam
  group: StudentGroup | null
  totalStudents: number
  submitted: number
  graded: number
  pending: number
}

type StatusType = "completed" | "grading" | "in_progress" | "pending"
type StatusFilter = "all" | StatusType

export default function ExamsPage() {
  const { user } = useAuth()
  const [examAssignments, setExamAssignments] = useState<
    ExamAssignmentWithStats[]
  >([])
  const [exams, setExams] = useState<Exam[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [loadingExams, setLoadingExams] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  const [examFilter, setExamFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      if (USE_MOCK_DATA) {
        setExams(MOCK_DATA.exams)
        setGroups(MOCK_DATA.studentGroups)

        const assignmentsWithStats: ExamAssignmentWithStats[] =
          MOCK_DATA.examAssignments.map((ea) => {
            const exam = MOCK_DATA.exams.find((e) => e.id === ea.exam_id)!
            const group = ea.group_id
              ? MOCK_DATA.studentGroups.find((g) => g.id === ea.group_id) ||
                null
              : null

            const studentAssignments = MOCK_DATA.assignments.filter(
              (a) => a.exam_assignment_id === ea.id
            )

            const submitted = studentAssignments.filter(
              (a) => a.status === "submitted" || a.status === "graded"
            ).length
            const graded = studentAssignments.filter(
              (a) => a.status === "graded"
            ).length
            const pending = studentAssignments.filter(
              (a) => a.status === "pending" || a.status === "in_progress"
            ).length

            return {
              ...ea,
              exam,
              group,
              totalStudents: studentAssignments.length,
              submitted,
              graded,
              pending,
            }
          })

        setExamAssignments(assignmentsWithStats)
      } else {
        const data = await apiClient.get<ExamAssignmentWithStats[]>(
          API_CONFIG.ENDPOINTS.EXAMS
        )
        setExamAssignments(data)
      }
    } catch (error) {
      console.error("Error loading exams:", error)
    } finally {
      setLoadingExams(false)
    }
  }

  const getStatus = (ea: ExamAssignmentWithStats): StatusType => {
    if (ea.totalStudents === 0) return "pending"
    if (ea.graded === ea.totalStudents) return "completed"
    if (ea.submitted > ea.graded) return "grading"
    if (ea.submitted > 0 || ea.graded > 0) return "in_progress"
    return "pending"
  }

  const getGradingProgress = (ea: ExamAssignmentWithStats) => {
    if (ea.totalStudents === 0) return 0
    return Math.round((ea.graded / ea.totalStudents) * 100)
  }

  const getDateCategory = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays < 0) return "upcoming"
    if (diffDays <= 7) return "week"
    if (diffDays <= 30) return "month"
    return "older"
  }

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return examAssignments.filter((ea) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesTitle = ea.title.toLowerCase().includes(searchLower)
        const matchesExam = ea.exam.title.toLowerCase().includes(searchLower)
        const matchesGroup = ea.group?.name.toLowerCase().includes(searchLower)
        if (!matchesTitle && !matchesExam && !matchesGroup) return false
      }

      // Status filter
      if (statusFilter !== "all" && getStatus(ea) !== statusFilter) return false

      // Group filter
      if (groupFilter !== "all") {
        if (groupFilter === "individual" && ea.group_id !== null) return false
        if (groupFilter !== "individual" && ea.group_id !== groupFilter)
          return false
      }

      // Exam filter
      if (examFilter !== "all" && ea.exam_id !== examFilter) return false

      // Date filter
      if (dateFilter !== "all" && getDateCategory(ea.assigned_at) !== dateFilter)
        return false

      return true
    })
  }, [
    examAssignments,
    search,
    statusFilter,
    groupFilter,
    examFilter,
    dateFilter,
  ])

  const hasActiveFilters =
    search ||
    statusFilter !== "all" ||
    groupFilter !== "all" ||
    examFilter !== "all" ||
    dateFilter !== "all"

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setGroupFilter("all")
    setExamFilter("all")
    setDateFilter("all")
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
        {examAssignments.length > 0 && (
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por título, examen o grupo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-gray-200"
              />
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-[140px] bg-white border-gray-200 text-sm">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="grading">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Por calificar
                    </span>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      En progreso
                    </span>
                  </SelectItem>
                  <SelectItem value="completed">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Completados
                    </span>
                  </SelectItem>
                  <SelectItem value="pending">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-300" />
                      Pendientes
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-[140px] bg-white border-gray-200 text-sm">
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={examFilter} onValueChange={setExamFilter}>
                <SelectTrigger className="w-[180px] bg-white border-gray-200 text-sm">
                  <SelectValue placeholder="Examen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los exámenes</SelectItem>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px] bg-white border-gray-200 text-sm">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier fecha</SelectItem>
                  <SelectItem value="upcoming">Próximos</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="older">Más antiguos</SelectItem>
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
                {filteredAssignments.length} de {examAssignments.length} exámenes
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {examAssignments.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-64 flex-col items-center justify-center">
              <p className="mb-4 text-muted-foreground">
                No tienes exámenes asignados todavía
              </p>
              <Button asChild>
                <Link href="/dashboard/exams/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear tu primer examen
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : filteredAssignments.length === 0 ? (
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
            {filteredAssignments.map((ea) => {
              const status = getStatus(ea)
              const progress = getGradingProgress(ea)
              const toGrade = ea.submitted - ea.graded

              return (
                <Link
                  key={ea.id}
                  href={`/dashboard/exams/${ea.id}/results`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Status Indicator */}
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        status === "completed"
                          ? "bg-emerald-500"
                          : status === "grading"
                            ? "bg-amber-500"
                            : status === "in_progress"
                              ? "bg-blue-500"
                              : "bg-gray-300"
                      }`}
                    />
                    {status === "grading" && (
                      <div className="absolute h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping opacity-75" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {ea.title}
                      </h3>
                      {ea.group && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {ea.group.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {ea.exam.title}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 shrink-0">
                    {/* Progress indicator */}
                    <div className="flex items-center gap-3">
                      {status === "completed" ? (
                        <span className="text-sm font-medium text-emerald-600">
                          Completado
                        </span>
                      ) : status === "grading" ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                            {toGrade}
                          </span>
                          <span className="text-sm text-gray-500">
                            por calificar
                          </span>
                        </div>
                      ) : status === "in_progress" ? (
                        <span className="text-sm text-blue-600">
                          {progress}% calificado
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          {ea.totalStudents} estudiantes
                        </span>
                      )}
                    </div>

                    {/* Mini progress bar */}
                    {ea.totalStudents > 0 && status !== "pending" && (
                      <div className="w-16 h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            status === "completed"
                              ? "bg-emerald-500"
                              : status === "grading"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

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
