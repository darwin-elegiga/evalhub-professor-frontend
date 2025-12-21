"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import type { Student, StudentGroup } from "@/lib/types"
import {
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Mail,
  GraduationCap,
  Calendar,
} from "lucide-react"

type GroupBy = "none" | "group" | "year" | "career"

interface GroupedStudents {
  key: string
  label: string
  students: Student[]
  metadata?: {
    year?: number
    career?: string
    group?: StudentGroup
  }
}

export default function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [groupBy, setGroupBy] = useState<GroupBy>("group")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

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

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      student.career?.toLowerCase().includes(search.toLowerCase())
  )

  const groupStudents = (): GroupedStudents[] => {
    if (groupBy === "none") {
      return [
        {
          key: "all",
          label: "Todos los estudiantes",
          students: filteredStudents,
        },
      ]
    }

    const grouped = new Map<string, GroupedStudents>()

    filteredStudents.forEach((student) => {
      let key: string
      let label: string
      let metadata: GroupedStudents["metadata"] = {}

      switch (groupBy) {
        case "group":
          if (student.group_id) {
            const group = groups.find((g) => g.id === student.group_id)
            key = student.group_id
            label = group?.name || "Grupo desconocido"
            metadata = { group, year: group?.year, career: group?.career }
          } else {
            key = "sin-grupo"
            label = "Sin grupo asignado"
          }
          break
        case "year":
          key = student.year?.toString() || "sin-año"
          label = student.year ? `Año ${student.year}` : "Sin año asignado"
          metadata = { year: student.year || undefined }
          break
        case "career":
          key = student.career || "sin-carrera"
          label = student.career || "Sin carrera asignada"
          metadata = { career: student.career || undefined }
          break
        default:
          key = "all"
          label = "Todos"
      }

      if (!grouped.has(key)) {
        grouped.set(key, { key, label, students: [], metadata })
      }
      grouped.get(key)!.students.push(student)
    })

    return Array.from(grouped.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedGroups(new Set(groupStudents().map((g) => g.key)))
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Cargando estudiantes...
          </p>
        </div>
      </div>
    )
  }

  const groupedStudents = groupStudents()

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-gray-500">
            {students.length} estudiantes en {groups.length} grupos
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-gray-200">
          <CardContent className="py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o carrera..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Agrupar por:</span>
                <Select
                  value={groupBy}
                  onValueChange={(v) => setGroupBy(v as GroupBy)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Grupo</SelectItem>
                    <SelectItem value="year">Año</SelectItem>
                    <SelectItem value="career">Carrera</SelectItem>
                    <SelectItem value="none">Sin agrupar</SelectItem>
                  </SelectContent>
                </Select>
                {groupBy !== "none" && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={expandAll}
                      className="text-xs"
                    >
                      Expandir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={collapseAll}
                      className="text-xs"
                    >
                      Colapsar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Groups */}
        {filteredStudents.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <Users className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground">
                {search
                  ? "No se encontraron estudiantes"
                  : "No hay estudiantes registrados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groupedStudents.map((group) => {
              const isExpanded =
                groupBy === "none" || expandedGroups.has(group.key)

              return (
                <Card key={group.key} className="border-gray-200 overflow-hidden">
                  {/* Group Header */}
                  {groupBy !== "none" && (
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="flex w-full items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <div className="flex items-center gap-2">
                          {groupBy === "group" && (
                            <Users className="h-4 w-4 text-gray-500" />
                          )}
                          {groupBy === "year" && (
                            <Calendar className="h-4 w-4 text-gray-500" />
                          )}
                          {groupBy === "career" && (
                            <GraduationCap className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="font-medium text-gray-900">
                            {group.label}
                          </span>
                        </div>
                        {group.metadata?.career && groupBy === "group" && (
                          <Badge variant="secondary" className="bg-gray-200 text-xs">
                            {group.metadata.career}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-gray-500">
                        {group.students.length} estudiantes
                      </Badge>
                    </button>
                  )}

                  {/* Student Table */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white hover:bg-white">
                            <TableHead className="font-medium">Nombre</TableHead>
                            <TableHead className="font-medium">Email</TableHead>
                            {groupBy !== "group" && (
                              <TableHead className="font-medium">Grupo</TableHead>
                            )}
                            {groupBy !== "career" && (
                              <TableHead className="font-medium">Carrera</TableHead>
                            )}
                            {groupBy !== "year" && (
                              <TableHead className="font-medium">Año</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.students.map((student) => {
                            const studentGroup = groups.find(
                              (g) => g.id === student.group_id
                            )
                            return (
                              <TableRow
                                key={student.id}
                                className="hover:bg-gray-50"
                              >
                                <TableCell className="font-medium">
                                  {student.full_name}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="h-3.5 w-3.5" />
                                    {student.email}
                                  </div>
                                </TableCell>
                                {groupBy !== "group" && (
                                  <TableCell>
                                    {studentGroup ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-gray-100"
                                      >
                                        {studentGroup.name}
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </TableCell>
                                )}
                                {groupBy !== "career" && (
                                  <TableCell className="text-gray-600">
                                    {student.career || (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </TableCell>
                                )}
                                {groupBy !== "year" && (
                                  <TableCell className="text-gray-600">
                                    {student.year || (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
