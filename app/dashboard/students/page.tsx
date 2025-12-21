"use client"

import { useAuth } from "@/lib/auth-context"
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
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import type { Student, StudentGroup } from "@/lib/types"
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  GraduationCap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react"

type SortField = "name" | "email" | "career" | "year" | "group"
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100]

export default function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  const [careerFilter, setCareerFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")

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
        setStudents(MOCK_DATA.students)
        setGroups(MOCK_DATA.studentGroups)
      } else {
        const [studentsData, groupsData] = await Promise.all([
          apiClient.get<Student[]>(API_CONFIG.ENDPOINTS.STUDENTS),
          apiClient.get<StudentGroup[]>("/api/student-groups"),
        ])
        setStudents(studentsData)
        setGroups(groupsData)
      }
    } catch (error) {
      console.error("Error loading students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get unique values for filters
  const uniqueCareers = useMemo(() => {
    const careers = new Set(students.map((s) => s.career).filter(Boolean))
    return Array.from(careers).sort()
  }, [students])

  const uniqueYears = useMemo(() => {
    const years = new Set(students.map((s) => s.year).filter(Boolean))
    return Array.from(years).sort((a, b) => (a || 0) - (b || 0))
  }, [students])

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let result = students.filter((student) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesName = student.full_name.toLowerCase().includes(searchLower)
        const matchesEmail = student.email.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesEmail) return false
      }

      // Group filter
      if (groupFilter !== "all") {
        if (groupFilter === "none" && student.group_id) return false
        if (groupFilter !== "none" && student.group_id !== groupFilter) return false
      }

      // Career filter
      if (careerFilter !== "all" && student.career !== careerFilter) return false

      // Year filter
      if (yearFilter !== "all" && student.year?.toString() !== yearFilter) return false

      return true
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      const groupA = groups.find((g) => g.id === a.group_id)
      const groupB = groups.find((g) => g.id === b.group_id)

      switch (sortField) {
        case "name":
          comparison = a.full_name.localeCompare(b.full_name)
          break
        case "email":
          comparison = a.email.localeCompare(b.email)
          break
        case "career":
          comparison = (a.career || "").localeCompare(b.career || "")
          break
        case "year":
          comparison = (a.year || 0) - (b.year || 0)
          break
        case "group":
          comparison = (groupA?.name || "").localeCompare(groupB?.name || "")
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return result
  }, [students, groups, search, groupFilter, careerFilter, yearFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage)
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedStudents.slice(start, start + itemsPerPage)
  }, [filteredAndSortedStudents, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, groupFilter, careerFilter, yearFilter, itemsPerPage])

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

  const hasActiveFilters = search || groupFilter !== "all" || careerFilter !== "all" || yearFilter !== "all"

  const clearFilters = () => {
    setSearch("")
    setGroupFilter("all")
    setCareerFilter("all")
    setYearFilter("all")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando estudiantes...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{students.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-500">Grupos</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{groups.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-500">Carreras</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{uniqueCareers.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Filtrados</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{filteredAndSortedStudents.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-gray-200"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[160px] bg-white border-gray-200 text-sm">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                <SelectItem value="none">Sin grupo</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={careerFilter} onValueChange={setCareerFilter}>
              <SelectTrigger className="w-[180px] bg-white border-gray-200 text-sm">
                <SelectValue placeholder="Carrera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las carreras</SelectItem>
                {uniqueCareers.map((c) => (
                  <SelectItem key={c} value={c!}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px] bg-white border-gray-200 text-sm">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueYears.map((y) => (
                  <SelectItem key={y} value={y!.toString()}>
                    Año {y}
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
        </div>

        {/* Table */}
        {filteredAndSortedStudents.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <Users className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "No se encontraron estudiantes con estos filtros"
                  : "No hay estudiantes registrados"}
              </p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2">
                  Limpiar filtros
                </Button>
              )}
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
                Nombre <SortIcon field="name" />
              </button>
              <button
                onClick={() => handleSort("email")}
                className="col-span-3 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
              >
                Email <SortIcon field="email" />
              </button>
              <button
                onClick={() => handleSort("group")}
                className="col-span-2 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
              >
                Grupo <SortIcon field="group" />
              </button>
              <button
                onClick={() => handleSort("career")}
                className="col-span-3 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
              >
                Carrera <SortIcon field="career" />
              </button>
              <button
                onClick={() => handleSort("year")}
                className="col-span-1 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
              >
                Año <SortIcon field="year" />
              </button>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-50">
              {paginatedStudents.map((student, index) => {
                const studentGroup = groups.find((g) => g.id === student.group_id)
                return (
                  <div
                    key={student.id}
                    className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <div className="col-span-3 font-medium text-gray-900 truncate">
                      {student.full_name}
                    </div>
                    <div className="col-span-3 text-gray-600 truncate flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="col-span-2">
                      {studentGroup ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs font-normal">
                          {studentGroup.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                    <div className="col-span-3 text-gray-600 truncate">
                      {student.career || <span className="text-gray-400">—</span>}
                    </div>
                    <div className="col-span-1 text-gray-600">
                      {student.year || <span className="text-gray-400">—</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-500">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedStudents.length)} de{" "}
                  {filteredAndSortedStudents.length}
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

                  {/* Page numbers */}
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
      </div>
    </main>
  )
}
