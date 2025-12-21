"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState, useMemo } from "react"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Grade, StudentGroup, Exam, FinalGrade } from "@/lib/types"
import {
  GraduationCap,
  Users,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ClipboardList,
} from "lucide-react"
import Link from "next/link"

// Final grade labels for 2-5 scale
const FINAL_GRADE_LABELS: Record<FinalGrade, { label: string; color: string; bg: string }> = {
  2: { label: "Reprobado", color: "text-red-600", bg: "bg-red-50" },
  3: { label: "Aprobado", color: "text-yellow-600", bg: "bg-yellow-50" },
  4: { label: "Bueno", color: "text-blue-600", bg: "bg-blue-50" },
  5: { label: "Excelente", color: "text-green-600", bg: "bg-green-50" },
}

interface AssignmentWithDetails {
  id: string
  status: string
  assigned_at: string
  submitted_at: string | null
  student: {
    id: string
    full_name: string
    email: string
    career?: string | null
    group_id?: string | null
  }
  exam: {
    id: string
    title: string
  }
  grade: Grade | null
}

type SortField = "name" | "status" | "submitted" | "grade"
type SortDirection = "asc" | "desc"
type StatusFilter = "all" | "pending" | "in_progress" | "submitted" | "graded"

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100]

export default function GradesPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cascade filters
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [selectedExam, setSelectedExam] = useState<string>("")

  // Additional filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  // Sorting
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      if (USE_MOCK_DATA) {
        // Load groups and exams for filters
        setGroups(MOCK_DATA.studentGroups)
        setExams(MOCK_DATA.exams)

        // Build assignments with full student details
        const assignmentsWithDetails: AssignmentWithDetails[] =
          MOCK_DATA.assignments.map((assignment) => {
            const student = MOCK_DATA.students.find(
              (s) => s.id === assignment.student_id
            )
            const exam = MOCK_DATA.exams.find(
              (e) => e.id === assignment.exam_id
            )
            const grade = MOCK_DATA.grades.find(
              (g) => g.assignment_id === assignment.id
            )

            return {
              id: assignment.id,
              status: assignment.status,
              assigned_at: assignment.assigned_at,
              submitted_at: assignment.submitted_at,
              student: {
                id: student?.id || "",
                full_name: student?.full_name || "Estudiante",
                email: student?.email || "",
                career: student?.career,
                group_id: student?.group_id,
              },
              exam: {
                id: exam?.id || "",
                title: exam?.title || "Examen",
              },
              grade: grade || null,
            }
          })
        setAssignments(assignmentsWithDetails)
      } else {
        const [assignmentsData, groupsData, examsData] = await Promise.all([
          apiClient.get<AssignmentWithDetails[]>(API_CONFIG.ENDPOINTS.ASSIGNMENTS),
          apiClient.get<StudentGroup[]>("/api/student-groups"),
          apiClient.get<Exam[]>(API_CONFIG.ENDPOINTS.EXAMS),
        ])
        setAssignments(assignmentsData)
        setGroups(groupsData)
        setExams(examsData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get unique careers from groups
  const uniqueCareers = useMemo(() => {
    const careers = new Set(groups.map((g) => g.career).filter(Boolean))
    return Array.from(careers).sort()
  }, [groups])

  // Filter groups by selected career
  const filteredGroups = useMemo(() => {
    if (!selectedCareer) return []
    return groups.filter((g) => g.career === selectedCareer)
  }, [groups, selectedCareer])

  // Filter exams by selected group (exams assigned to students in that group)
  const filteredExams = useMemo(() => {
    if (!selectedGroup) return []
    const examIds = new Set(
      assignments
        .filter((a) => a.student.group_id === selectedGroup)
        .map((a) => a.exam.id)
    )
    return exams.filter((e) => examIds.has(e.id))
  }, [exams, assignments, selectedGroup])

  // Filter and sort assignments
  const filteredAndSortedAssignments = useMemo(() => {
    // Only show assignments if all cascade filters are selected
    if (!selectedCareer || !selectedGroup || !selectedExam) return []

    let result = assignments.filter((a) => {
      // Must match group and exam
      if (a.student.group_id !== selectedGroup) return false
      if (a.exam.id !== selectedExam) return false

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesName = a.student.full_name.toLowerCase().includes(searchLower)
        const matchesEmail = a.student.email.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesEmail) return false
      }

      // Status filter
      if (statusFilter !== "all" && a.status !== statusFilter) return false

      return true
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "name":
          comparison = a.student.full_name.localeCompare(b.student.full_name)
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        case "submitted":
          const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
          const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
          comparison = dateA - dateB
          break
        case "grade":
          const gradeA = a.grade?.final_grade || 0
          const gradeB = b.grade?.final_grade || 0
          comparison = gradeA - gradeB
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return result
  }, [assignments, selectedCareer, selectedGroup, selectedExam, search, statusFilter, sortField, sortDirection])

  // Stats for current selection
  const stats = useMemo(() => {
    if (!selectedExam) return null
    const filtered = assignments.filter(
      (a) => a.student.group_id === selectedGroup && a.exam.id === selectedExam
    )
    return {
      total: filtered.length,
      pending: filtered.filter((a) => a.status === "pending").length,
      inProgress: filtered.filter((a) => a.status === "in_progress").length,
      submitted: filtered.filter((a) => a.status === "submitted").length,
      graded: filtered.filter((a) => a.status === "graded").length,
      averageGrade: filtered.filter((a) => a.grade).length > 0
        ? (filtered.reduce((sum, a) => sum + (a.grade?.final_grade || 0), 0) /
           filtered.filter((a) => a.grade).length).toFixed(1)
        : null,
    }
  }, [assignments, selectedGroup, selectedExam])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAssignments.length / itemsPerPage)
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedAssignments.slice(start, start + itemsPerPage)
  }, [filteredAndSortedAssignments, currentPage, itemsPerPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, selectedExam, itemsPerPage])

  // Reset cascade when parent changes
  useEffect(() => {
    setSelectedGroup("")
    setSelectedExam("")
  }, [selectedCareer])

  useEffect(() => {
    setSelectedExam("")
  }, [selectedGroup])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1 bg-gray-100 text-gray-600">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="gap-1 bg-blue-100 text-blue-700">
            <AlertCircle className="h-3 w-3" />
            En Progreso
          </Badge>
        )
      case "submitted":
        return (
          <Badge className="gap-1 bg-amber-100 text-amber-700">
            <CheckCircle className="h-3 w-3" />
            Por Calificar
          </Badge>
        )
      case "graded":
        return (
          <Badge className="gap-1 bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            Calificado
          </Badge>
        )
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Cascade Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500 mb-3">Selecciona para ver las calificaciones:</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Career Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                1. Carrera
              </label>
              <Select value={selectedCareer} onValueChange={setSelectedCareer}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Selecciona una carrera" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCareers.map((career) => (
                    <SelectItem key={career} value={career!}>
                      {career}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                2. Grupo
              </label>
              <Select
                value={selectedGroup}
                onValueChange={setSelectedGroup}
                disabled={!selectedCareer}
              >
                <SelectTrigger className={`bg-white border-gray-200 ${!selectedCareer ? "opacity-50" : ""}`}>
                  <SelectValue placeholder={selectedCareer ? "Selecciona un grupo" : "Primero selecciona carrera"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exam Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                3. Examen
              </label>
              <Select
                value={selectedExam}
                onValueChange={setSelectedExam}
                disabled={!selectedGroup}
              >
                <SelectTrigger className={`bg-white border-gray-200 ${!selectedGroup ? "opacity-50" : ""}`}>
                  <SelectValue placeholder={selectedGroup ? "Selecciona un examen" : "Primero selecciona grupo"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredExams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content based on selection state */}
        {!selectedCareer ? (
          // Initial state - prompt to select
          <Card className="border-gray-200">
            <CardContent className="flex h-64 flex-col items-center justify-center">
              <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground text-center">
                Selecciona una carrera para comenzar
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Las calificaciones se mostrarán después de seleccionar carrera, grupo y examen
              </p>
            </CardContent>
          </Card>
        ) : !selectedGroup ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <Users className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-muted-foreground">
                Ahora selecciona un grupo de {selectedCareer}
              </p>
            </CardContent>
          </Card>
        ) : !selectedExam ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <FileText className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-muted-foreground">
                Selecciona un examen para ver las calificaciones
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Row */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-semibold">{stats.total}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Pendientes</p>
                  <p className="text-xl font-semibold text-gray-500">{stats.pending + stats.inProgress}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-600">Por Calificar</p>
                  <p className="text-xl font-semibold text-amber-700">{stats.submitted}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs text-green-600">Calificados</p>
                  <p className="text-xl font-semibold text-green-700">{stats.graded}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-600">Promedio</p>
                  <p className="text-xl font-semibold text-blue-700">{stats.averageGrade || "—"}</p>
                </div>
              </div>
            )}

            {/* Search and Status Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar estudiante..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white border-gray-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[160px] bg-white border-gray-200">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="submitted">Por Calificar</SelectItem>
                  <SelectItem value="graded">Calificado</SelectItem>
                </SelectContent>
              </Select>
              {(search || statusFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-gray-500">Mostrar:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => setItemsPerPage(Number(v))}
                >
                  <SelectTrigger className="w-[80px] bg-white border-gray-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            {filteredAndSortedAssignments.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="flex h-32 flex-col items-center justify-center">
                  <p className="text-muted-foreground">
                    No se encontraron estudiantes con estos filtros
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("name")}
                    className="col-span-4 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                  >
                    Estudiante <SortIcon field="name" />
                  </button>
                  <button
                    onClick={() => handleSort("status")}
                    className="col-span-2 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                  >
                    Estado <SortIcon field="status" />
                  </button>
                  <button
                    onClick={() => handleSort("submitted")}
                    className="col-span-2 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                  >
                    Entrega <SortIcon field="submitted" />
                  </button>
                  <button
                    onClick={() => handleSort("grade")}
                    className="col-span-2 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                  >
                    Nota <SortIcon field="grade" />
                  </button>
                  <div className="col-span-2 text-right">Acciones</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-50">
                  {paginatedAssignments.map((assignment, index) => (
                    <div
                      key={assignment.id}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      <div className="col-span-4">
                        <p className="font-medium text-gray-900">{assignment.student.full_name}</p>
                        <p className="text-xs text-gray-500">{assignment.student.email}</p>
                      </div>
                      <div className="col-span-2 flex items-center">
                        {getStatusBadge(assignment.status)}
                      </div>
                      <div className="col-span-2 flex items-center text-gray-600">
                        {assignment.submitted_at
                          ? new Date(assignment.submitted_at).toLocaleDateString("es", {
                              day: "2-digit",
                              month: "short",
                            })
                          : <span className="text-gray-400">—</span>}
                      </div>
                      <div className="col-span-2 flex items-center">
                        {assignment.grade ? (
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${FINAL_GRADE_LABELS[assignment.grade.final_grade].bg}`}>
                            <span className={`font-bold ${FINAL_GRADE_LABELS[assignment.grade.final_grade].color}`}>
                              {assignment.grade.final_grade}
                            </span>
                            <span className={`text-xs ${FINAL_GRADE_LABELS[assignment.grade.final_grade].color}`}>
                              {FINAL_GRADE_LABELS[assignment.grade.final_grade].label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/grades/${assignment.id}`}>
                            <Eye className="mr-1.5 h-4 w-4" />
                            {assignment.status === "submitted" ? "Calificar" : "Ver"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-sm text-gray-500">
                      Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
                      {Math.min(currentPage * itemsPerPage, filteredAndSortedAssignments.length)} de{" "}
                      {filteredAndSortedAssignments.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1 px-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "ghost"}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
