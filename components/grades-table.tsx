"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface Assignment {
  id: string
  status: string
  assigned_at: string
  submitted_at: string | null
  student: {
    full_name: string
    email: string
  }
  exam: {
    id: string
    title: string
  }
  grade: Array<{
    percentage: number
    points_earned: number
    total_points: number
  }> | null
}

interface GradesTableProps {
  assignments: Assignment[]
}

export function GradesTable({ assignments }: GradesTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      assignment.exam.title.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <AlertCircle className="h-3 w-3" />
            En Progreso
          </Badge>
        )
      case "submitted":
        return (
          <Badge variant="default" className="gap-1 bg-orange-500">
            <CheckCircle className="h-3 w-3" />
            Entregado
          </Badge>
        )
      case "graded":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Calificado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3" />
            Desconocido
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Buscar por estudiante o examen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="submitted">Entregado</SelectItem>
            <SelectItem value="graded">Calificado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">No se encontraron asignaciones</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Examen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Entrega</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assignment.student.full_name}</div>
                      <div className="text-sm text-muted-foreground">{assignment.student.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.exam.title}</TableCell>
                  <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                  <TableCell>
                    {assignment.submitted_at ? new Date(assignment.submitted_at).toLocaleDateString() : "No entregado"}
                  </TableCell>
                  <TableCell>
                    {assignment.grade && assignment.grade.length > 0 ? (
                      <div>
                        <div className="font-medium">{assignment.grade[0].percentage.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.grade[0].points_earned} / {assignment.grade[0].total_points} pts
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/grades/${assignment.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {assignment.status === "submitted" ? "Calificar" : "Ver"}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
