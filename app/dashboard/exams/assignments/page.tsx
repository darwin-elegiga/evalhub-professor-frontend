"use client"

import { useAuth } from "@/lib/auth-context"
import { authFetch } from "@/lib/api-client"
import { useEffect, useState, useMemo } from "react"
import type { Exam, StudentGroup } from "@/lib/types"
import {
  ArrowLeft,
  Search,
  X,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  MoreHorizontal,
  Copy,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { toast } from "sonner"

type AssignmentStatus = "pending" | "in_progress" | "submitted" | "graded"

interface AssignmentResponse {
  id: string
  examId: string
  examTitle: string
  studentId: string
  studentName: string
  studentEmail: string
  magicToken: string
  magicLink: string
  status: AssignmentStatus
  assignedAt: string
  startedAt: string | null
  submittedAt: string | null
  score: number | null
  studentGroupId?: string
}

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; dot: string }> = {
  pending: { label: "Pendiente", dot: "bg-gray-400" },
  in_progress: { label: "En progreso", dot: "bg-blue-500" },
  submitted: { label: "Entregado", dot: "bg-amber-500" },
  graded: { label: "Calificado", dot: "bg-green-500" },
}

export default function ExamAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [examFilter, setExamFilter] = useState<string>("all")

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [assignmentsRes, examsRes, groupsRes] = await Promise.all([
        authFetch("/api/assignments"),
        authFetch("/api/exams"),
        authFetch("/api/groups"),
      ])
      const [assignmentsData, examsData, groupsData] = await Promise.all([
        assignmentsRes.json(),
        examsRes.json(),
        groupsRes.json(),
      ])
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
      setExams(Array.isArray(examsData) ? examsData : [])
      setGroups(Array.isArray(groupsData) ? groupsData : [])
    } catch (error) {
      console.error("Error loading assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesExam = assignment.examTitle?.toLowerCase().includes(searchLower)
        const matchesStudent = assignment.studentName?.toLowerCase().includes(searchLower)
        const matchesEmail = assignment.studentEmail?.toLowerCase().includes(searchLower)
        if (!matchesExam && !matchesStudent && !matchesEmail) return false
      }
      if (statusFilter !== "all" && assignment.status !== statusFilter) return false
      if (examFilter !== "all" && assignment.examId !== examFilter) return false
      return true
    })
  }, [assignments, search, statusFilter, examFilter])

  const stats = useMemo(() => ({
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    inProgress: assignments.filter((a) => a.status === "in_progress").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
  }), [assignments])

  const hasActiveFilters = search || statusFilter !== "all" || examFilter !== "all"

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setExamFilter("all")
  }

  const copyMagicLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success("Enlace copiado")
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/dashboard/exams">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Asignaciones</h1>
              <p className="text-xs text-gray-500">{stats.total} total</p>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-gray-600">{stats.submitted} por calificar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-gray-600">{stats.graded} calificados</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-white text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 bg-white text-sm">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="submitted">Entregado</SelectItem>
              <SelectItem value="graded">Calificado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={examFilter} onValueChange={setExamFilter}>
            <SelectTrigger className="w-[160px] h-9 bg-white text-sm">
              <SelectValue placeholder="Examen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-gray-500">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results info */}
        {hasActiveFilters && (
          <p className="text-xs text-gray-500">
            {filteredAssignments.length} resultado{filteredAssignments.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Empty State */}
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">Sin asignaciones</p>
            <p className="text-xs text-gray-500 mt-1">Asigna un examen a un grupo para comenzar</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-gray-500">Sin resultados</p>
            <Button variant="link" size="sm" onClick={clearFilters} className="text-xs">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          /* Table */
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">Estudiante</div>
              <div className="col-span-3">Examen</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-1"></div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {filteredAssignments.map((assignment) => {
                const statusConfig = STATUS_CONFIG[assignment.status]

                return (
                  <div
                    key={assignment.id}
                    className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Student */}
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {assignment.studentName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {assignment.studentEmail}
                      </p>
                    </div>

                    {/* Exam */}
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        {assignment.examTitle}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                        <span className="text-xs text-gray-600">{statusConfig.label}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">
                        {assignment.submittedAt
                          ? new Date(assignment.submittedAt).toLocaleDateString("es", {
                              day: "numeric",
                              month: "short",
                            })
                          : assignment.assignedAt
                          ? new Date(assignment.assignedAt).toLocaleDateString("es", {
                              day: "numeric",
                              month: "short",
                            })
                          : "—"}
                      </p>
                      {assignment.score !== null && (
                        <p className="text-xs font-medium text-gray-900">{assignment.score} pts</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => copyMagicLink(assignment.magicLink)}>
                            <Copy className="h-3.5 w-3.5 mr-2" />
                            Copiar enlace
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={assignment.magicLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-2" />
                              Abrir
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/exams/${assignment.examId}/results`}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              Resultados
                            </Link>
                          </DropdownMenuItem>
                          {assignment.status === "submitted" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/grades/assignment/${assignment.id}`}>
                                <CheckCircle className="h-3.5 w-3.5 mr-2" />
                                Calificar
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
