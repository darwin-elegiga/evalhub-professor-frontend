"use client"

import { useAuth } from "@/lib/auth-context"
import { authFetch } from "@/lib/api-client"
import { useEffect, useState, useMemo } from "react"
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
import type { GradeWithDetails, StudentGroup, FinalGrade, StudentExamAssignment } from "@/lib/types"
import {
  GraduationCap,
  Users,
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
  Pencil,
} from "lucide-react"
import Link from "next/link"

// Final grade labels for 2-5 scale
const FINAL_GRADE_LABELS: Record<FinalGrade, { label: string; color: string; bg: string }> = {
  2: { label: "Reprobado", color: "text-red-600", bg: "bg-red-50" },
  3: { label: "Aprobado", color: "text-yellow-600", bg: "bg-yellow-50" },
  4: { label: "Bueno", color: "text-blue-600", bg: "bg-blue-50" },
  5: { label: "Excelente", color: "text-green-600", bg: "bg-green-50" },
}

// Assignment with embedded info for display
interface AssignmentWithDetails {
  id: string
  status: "pending" | "in_progress" | "submitted" | "graded"
  assignedAt: string
  submittedAt: string | null
  student: {
    id: string
    fullName: string
    email: string
    career?: string | null
  }
  exam: {
    id: string
    title: string
  }
  grade?: GradeWithDetails | null
}

type SortField = "name" | "status" | "submitted" | "grade"
type SortDirection = "asc" | "desc"
type StatusFilter = "all" | "submitted" | "graded"

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100]

export default function GradesPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cascade filters
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [selectedGroup, setSelectedGroup] = useState<string>("")

  // Additional filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  // Sorting
  const [sortField, setSortField] = useState<SortField>("status")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  useEffect(() => {
    if (user) {
      loadGroups()
    }
  }, [user])

  // Load assignments when group changes
  useEffect(() => {
    if (user && selectedGroup) {
      loadAssignments()
    } else {
      setAssignments([])
    }
  }, [user, selectedGroup])

  const loadGroups = async () => {
    try {
      const res = await authFetch("/api/groups")
      const groupsData: StudentGroup[] = await res.json()
      setGroups(Array.isArray(groupsData) ? groupsData : [])
    } catch (error) {
      console.error("Error loading groups:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssignments = async () => {
    setIsLoading(true)
    try {
      // Fetch assignments for grading - need two separate calls since API only accepts single status
      const [submittedRes, gradedRes] = await Promise.all([
        authFetch("/api/assignments?status=submitted"),
        authFetch("/api/assignments?status=graded"),
      ])
      const [submittedData, gradedData] = await Promise.all([
        submittedRes.json(),
        gradedRes.json(),
      ])

      // Combine and deduplicate by id
      const allSubmitted = Array.isArray(submittedData) ? submittedData : []
      const allGraded = Array.isArray(gradedData) ? gradedData : []
      const allAssignments = [...allSubmitted, ...allGraded]
      const uniqueAssignments = allAssignments.filter(
        (assignment: AssignmentWithDetails, index: number, self: AssignmentWithDetails[]) =>
          index === self.findIndex((a) => a.id === assignment.id)
      )

      setAssignments(uniqueAssignments)
    } catch (error) {
      console.error("Error loading assignments:", error)
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

  // Filter and sort assignments
  const filteredAndSortedAssignments = useMemo(() => {
    let result = assignments

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter((a) => {
        const matchesName = a.student.fullName.toLowerCase().includes(searchLower)
        const matchesEmail = a.student.email.toLowerCase().includes(searchLower)
        const matchesExam = a.exam.title.toLowerCase().includes(searchLower)
        return matchesName || matchesEmail || matchesExam
      })
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter)
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "name":
          comparison = a.student.fullName.localeCompare(b.student.fullName)
          break
        case "status":
          // submitted before graded (pending review first)
          comparison = a.status === "submitted" ? -1 : b.status === "submitted" ? 1 : 0
          break
        case "submitted":
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
          comparison = dateA - dateB
          break
        case "grade":
          const gradeA = a.grade?.finalGrade || 0
          const gradeB = b.grade?.finalGrade || 0
          comparison = gradeA - gradeB
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return result
  }, [assignments, search, statusFilter, sortField, sortDirection])

  // Stats for current selection
  const stats = useMemo(() => {
    if (assignments.length === 0) return null

    const submitted = assignments.filter((a) => a.status === "submitted").length
    const graded = assignments.filter((a) => a.status === "graded").length
    const gradedAssignments = assignments.filter((a) => a.grade)
    const average = gradedAssignments.length > 0
      ? gradedAssignments.reduce((sum, a) => sum + (a.grade?.finalGrade || 0), 0) / gradedAssignments.length
      : null

    return {
      total: assignments.length,
      submitted,
      graded,
      average: average?.toFixed(2) || null,
    }
  }, [assignments])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAssignments.length / itemsPerPage)
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedAssignments.slice(start, start + itemsPerPage)
  }, [filteredAndSortedAssignments, currentPage, itemsPerPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, itemsPerPage])

  // Reset cascade when parent changes
  useEffect(() => {
    setSelectedGroup("")
  }, [selectedCareer])

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
      case "submitted":
        return (
          <Badge className="gap-1 bg-amber-100 text-amber-700">
            <Clock className="h-3 w-3" />
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

  if (isLoading && assignments.length === 0 && !selectedCareer) {
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          </div>
        </div>

        {/* Content based on selection state */}
        {!selectedCareer ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-64 flex-col items-center justify-center">
              <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground text-center">
                Selecciona una carrera para comenzar
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Las calificaciones se mostrarán después de seleccionar carrera y grupo
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
        ) : isLoading ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground mt-4">Cargando asignaciones...</p>
            </CardContent>
          </Card>
        ) : assignments.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <ClipboardList className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-muted-foreground">
                No hay exámenes entregados o calificados para este grupo
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Row */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-semibold">{stats.total}</p>
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
                  <p className="text-xl font-semibold text-blue-700">{stats.average || "—"}</p>
                </div>
              </div>
            )}

            {/* Search and Status Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar estudiante o examen..."
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
                  <SelectItem value="submitted">Por Calificar</SelectItem>
                  <SelectItem value="graded">Calificados</SelectItem>
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
                    No se encontraron asignaciones con estos filtros
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("name")}
                    className="col-span-3 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                  >
                    Estudiante <SortIcon field="name" />
                  </button>
                  <div className="col-span-3">Examen</div>
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
                    className="col-span-1 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                  >
                    Nota <SortIcon field="grade" />
                  </button>
                  <div className="col-span-1 text-right">Acción</div>
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
                      <div className="col-span-3">
                        <p className="font-medium text-gray-900">{assignment.student.fullName}</p>
                        <p className="text-xs text-gray-500">{assignment.student.email}</p>
                      </div>
                      <div className="col-span-3 flex items-center text-gray-700">
                        {assignment.exam.title}
                      </div>
                      <div className="col-span-2 flex items-center">
                        {getStatusBadge(assignment.status)}
                      </div>
                      <div className="col-span-2 flex items-center text-gray-600">
                        {assignment.submittedAt
                          ? new Date(assignment.submittedAt).toLocaleDateString("es", {
                              day: "2-digit",
                              month: "short",
                            })
                          : <span className="text-gray-400">—</span>}
                      </div>
                      <div className="col-span-1 flex items-center">
                        {assignment.grade ? (
                          <div className={`inline-flex items-center px-2 py-0.5 rounded ${FINAL_GRADE_LABELS[assignment.grade.finalGrade].bg}`}>
                            <span className={`font-bold ${FINAL_GRADE_LABELS[assignment.grade.finalGrade].color}`}>
                              {assignment.grade.finalGrade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/grades/assignment/${assignment.id}`}>
                            {assignment.status === "submitted" ? (
                              <Pencil className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
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
