"use client"

import { useAuth } from "@/lib/auth-context"
import { useHeaderActions } from "@/lib/header-actions-context"
import { useEffect, useState, useMemo, useCallback } from "react"
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
import type { Student, StudentGroup, Career } from "@/lib/types"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Mail,
  GraduationCap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Check,
} from "lucide-react"

type SortField = "name" | "email" | "career" | "year" | "group"
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100]

interface NewStudentForm {
  fullName: string
  email: string
  groupIds: string[]
  career: string
  year: string
}

interface ImportResult {
  success: number
  errors: { row: number; message: string }[]
}

const INITIAL_FORM: NewStudentForm = {
  fullName: "",
  email: "",
  groupIds: [],
  career: "",
  year: "",
}

interface GroupForm {
  name: string
  year: string
  career: string
}

const INITIAL_GROUP_FORM: GroupForm = {
  name: "",
  year: "",
  career: "",
}

export default function StudentsPage() {
  const { user } = useAuth()
  const { setActions, clearActions } = useHeaderActions()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [careers, setCareers] = useState<Career[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Add student modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newStudentForm, setNewStudentForm] = useState<NewStudentForm>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Groups panel
  const [isGroupsPanelOpen, setIsGroupsPanelOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [groupForm, setGroupForm] = useState<GroupForm>(INITIAL_GROUP_FORM)
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null)
  const [isGroupSubmitting, setIsGroupSubmitting] = useState(false)
  const [groupFormError, setGroupFormError] = useState<string | null>(null)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)

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

  // Inline editing
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  const [editingGroupIds, setEditingGroupIds] = useState<string[]>([])
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Header actions callbacks
  const openAddModal = useCallback(() => setIsAddModalOpen(true), [])
  const openImportModal = useCallback(() => setIsImportModalOpen(true), [])
  const openGroupsPanel = useCallback(() => setIsGroupsPanelOpen(true), [])

  // Register header actions
  useEffect(() => {
    setActions([
      { label: "Nuevo Estudiante", onClick: openAddModal },
      { label: "Importar", onClick: openImportModal },
      { label: "Grupos", onClick: openGroupsPanel },
    ])
    return () => clearActions()
  }, [setActions, clearActions, openAddModal, openImportModal, openGroupsPanel])

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
        setCareers([
          { id: "1", name: "Ingeniería en Sistemas", code: "ISC", isActive: true, createdAt: "", updatedAt: "" },
          { id: "2", name: "Biomédica", code: "BIOMED", isActive: true, createdAt: "", updatedAt: "" },
        ])
      } else {
        const [studentsData, groupsData, careersData] = await Promise.all([
          apiClient.get<Student[]>(API_CONFIG.ENDPOINTS.STUDENTS),
          apiClient.get<StudentGroup[]>(API_CONFIG.ENDPOINTS.GROUPS),
          apiClient.get<Career[]>(API_CONFIG.ENDPOINTS.CAREERS),
        ])
        setStudents(studentsData)
        setGroups(groupsData)
        setCareers(careersData.filter((c) => c.isActive))
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
    return Array.from(years).sort((a, b) => parseInt(a) - parseInt(b))
  }, [students])

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let result = students.filter((student) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesName = student.fullName.toLowerCase().includes(searchLower)
        const matchesEmail = student.email.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesEmail) return false
      }

      // Group filter
      if (groupFilter !== "all") {
        const studentGroupIds = student.groups.map((g) => g.id)
        if (groupFilter === "none" && studentGroupIds.length > 0) return false
        if (groupFilter !== "none" && !studentGroupIds.includes(groupFilter)) return false
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
      const groupAName = a.groups[0]?.name || ""
      const groupBName = b.groups[0]?.name || ""

      switch (sortField) {
        case "name":
          comparison = a.fullName.localeCompare(b.fullName)
          break
        case "email":
          comparison = a.email.localeCompare(b.email)
          break
        case "career":
          comparison = (a.career || "").localeCompare(b.career || "")
          break
        case "year":
          comparison = parseInt(a.year || "0") - parseInt(b.year || "0")
          break
        case "group":
          comparison = groupAName.localeCompare(groupBName)
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

  // Create single student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validación: carrera es obligatoria
    if (!newStudentForm.career) {
      setFormError("La carrera es obligatoria")
      return
    }

    setIsSubmitting(true)

    try {
      // Payload for API
      const payload = {
        fullName: newStudentForm.fullName.trim(),
        email: newStudentForm.email.trim(),
        year: newStudentForm.year || new Date().getFullYear().toString(),
        career: newStudentForm.career,
        groupIds: newStudentForm.groupIds,
      }

      if (USE_MOCK_DATA) {
        const newStudent: Student = {
          id: crypto.randomUUID(),
          fullName: payload.fullName,
          email: payload.email,
          year: payload.year,
          career: payload.career,
          groups: payload.groupIds.map((gid) => {
            const g = groups.find((gr) => gr.id === gid)
            return { id: gid, name: g?.name || "" }
          }),
          createdAt: new Date().toISOString(),
        }
        setStudents((prev) => [...prev, newStudent])
      } else {
        const newStudent = await apiClient.post<Student>(API_CONFIG.ENDPOINTS.STUDENTS, payload)
        setStudents((prev) => [...prev, newStudent])
      }

      setNewStudentForm(INITIAL_FORM)
      setIsAddModalOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Error al crear estudiante")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Interface for parsed import data
  interface ParsedStudentData {
    fullName: string
    email: string
    career: string
    year: string
    groupIds: string[]
  }

  // Parse CSV file
  const parseCSV = (content: string): ParsedStudentData[] => {
    const lines = content.trim().split("\n")
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const nameIdx = headers.findIndex((h) => h === "fullname" || h === "full_name" || h === "nombre" || h === "name")
    const emailIdx = headers.findIndex((h) => h === "email" || h === "correo")
    const careerIdx = headers.findIndex((h) => h === "career" || h === "carrera")
    const yearIdx = headers.findIndex((h) => h === "year" || h === "año" || h === "ano")
    const groupIdx = headers.findIndex((h) => h === "groupids" || h === "group_id" || h === "grupo" || h === "group")

    if (nameIdx === -1 || emailIdx === -1) {
      throw new Error("El CSV debe tener columnas 'fullName' (o 'nombre') y 'email' (o 'correo')")
    }

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      return {
        fullName: values[nameIdx] || "",
        email: values[emailIdx] || "",
        career: careerIdx !== -1 ? values[careerIdx] || "" : "",
        year: yearIdx !== -1 ? values[yearIdx] || "" : "",
        groupIds: groupIdx !== -1 && values[groupIdx] ? [values[groupIdx]] : [],
      }
    }).filter((s) => s.fullName && s.email && s.career)
  }

  // Parse JSON file
  const parseJSON = (content: string): ParsedStudentData[] => {
    const data = JSON.parse(content)
    const items = Array.isArray(data) ? data : data.students || []

    return items.map((item: Record<string, unknown>) => ({
      fullName: String(item.fullName || item.full_name || item.nombre || item.name || ""),
      email: String(item.email || item.correo || ""),
      career: String(item.career || item.carrera || ""),
      year: String(item.year || item.año || item.ano || ""),
      groupIds: Array.isArray(item.groupIds) ? item.groupIds as string[] :
                item.group_id ? [String(item.group_id)] : [],
    })).filter((s: ParsedStudentData) => s.fullName && s.email && s.career)
  }

  // Import students from file
  const handleImportStudents = async () => {
    if (!importFile) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const content = await importFile.text()
      const isJSON = importFile.name.endsWith(".json")
      const parsedStudents = isJSON ? parseJSON(content) : parseCSV(content)

      if (parsedStudents.length === 0) {
        throw new Error("No se encontraron estudiantes válidos en el archivo")
      }

      const result: ImportResult = { success: 0, errors: [] }

      for (let i = 0; i < parsedStudents.length; i++) {
        const studentData = parsedStudents[i]
        try {
          const payload = {
            fullName: studentData.fullName,
            email: studentData.email,
            career: studentData.career,
            year: studentData.year || new Date().getFullYear().toString(),
            groupIds: studentData.groupIds,
          }

          if (USE_MOCK_DATA) {
            const newStudent: Student = {
              id: crypto.randomUUID(),
              fullName: payload.fullName,
              email: payload.email,
              career: payload.career,
              year: payload.year,
              groups: payload.groupIds.map((gid) => {
                const g = groups.find((gr) => gr.id === gid)
                return { id: gid, name: g?.name || "" }
              }),
              createdAt: new Date().toISOString(),
            }
            setStudents((prev) => [...prev, newStudent])
          } else {
            const newStudent = await apiClient.post<Student>(API_CONFIG.ENDPOINTS.STUDENTS, payload)
            setStudents((prev) => [...prev, newStudent])
          }
          result.success++
        } catch (error) {
          result.errors.push({
            row: i + 2,
            message: error instanceof Error ? error.message : "Error desconocido",
          })
        }
      }

      setImportResult(result)
      if (result.success > 0 && result.errors.length === 0) {
        setTimeout(() => {
          setIsImportModalOpen(false)
          setImportFile(null)
          setImportResult(null)
        }, 2000)
      }
    } catch (error) {
      setImportResult({
        success: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : "Error al procesar archivo" }],
      })
    } finally {
      setIsImporting(false)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setGroupFilter("all")
    setCareerFilter("all")
    setYearFilter("all")
  }

  // Group CRUD functions
  const openCreateGroupModal = () => {
    setEditingGroup(null)
    setGroupForm(INITIAL_GROUP_FORM)
    setGroupFormError(null)
    setIsGroupModalOpen(true)
  }

  const openEditGroupModal = (group: StudentGroup) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      year: group.year?.toString() || "",
      career: group.career || "",
    })
    setGroupFormError(null)
    setIsGroupModalOpen(true)
  }

  const handleCreateOrUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setGroupFormError(null)
    setIsGroupSubmitting(true)

    try {
      const payload = {
        name: groupForm.name.trim(),
        year: groupForm.year ? parseInt(groupForm.year) : new Date().getFullYear(),
        career: groupForm.career.trim() || "",
      }

      if (editingGroup) {
        // Update
        if (USE_MOCK_DATA) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === editingGroup.id ? { ...g, ...payload } : g
            )
          )
        } else {
          const updated = await apiClient.put<StudentGroup>(
            API_CONFIG.ENDPOINTS.GROUP_BY_ID(editingGroup.id),
            payload
          )
          setGroups((prev) =>
            prev.map((g) => (g.id === editingGroup.id ? updated : g))
          )
        }
      } else {
        // Create
        if (USE_MOCK_DATA) {
          const newGroup: StudentGroup = {
            id: crypto.randomUUID(),
            teacher_id: user?.id || "",
            name: payload.name,
            year: payload.year,
            career: payload.career,
            created_at: new Date().toISOString(),
          }
          setGroups((prev) => [...prev, newGroup])
        } else {
          const newGroup = await apiClient.post<StudentGroup>(
            API_CONFIG.ENDPOINTS.GROUPS,
            payload
          )
          setGroups((prev) => [...prev, newGroup])
        }
      }

      setIsGroupModalOpen(false)
      setGroupForm(INITIAL_GROUP_FORM)
      setEditingGroup(null)
    } catch (error) {
      setGroupFormError(
        error instanceof Error ? error.message : "Error al guardar grupo"
      )
    } finally {
      setIsGroupSubmitting(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return
    setIsDeletingGroup(true)

    try {
      if (USE_MOCK_DATA) {
        setGroups((prev) => prev.filter((g) => g.id !== deleteGroupId))
        // Also remove group from students' groups array
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            groups: s.groups.filter((g) => g.id !== deleteGroupId),
          }))
        )
      } else {
        await apiClient.delete(API_CONFIG.ENDPOINTS.GROUP_BY_ID(deleteGroupId))
        setGroups((prev) => prev.filter((g) => g.id !== deleteGroupId))
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            groups: s.groups.filter((g) => g.id !== deleteGroupId),
          }))
        )
      }
      setDeleteGroupId(null)
    } catch (error) {
      console.error("Error deleting group:", error)
    } finally {
      setIsDeletingGroup(false)
    }
  }

  const getStudentCountForGroup = (groupId: string) => {
    return students.filter((s) => s.groups.some((g) => g.id === groupId)).length
  }

  // Inline editing handlers
  const startEditing = (studentId: string, field: string, currentValue: string, groupIds?: string[]) => {
    setEditingStudentId(studentId)
    setEditingField(field)
    setEditingValue(currentValue)
    if (groupIds) {
      setEditingGroupIds(groupIds)
    }
  }

  const cancelEditing = () => {
    setEditingStudentId(null)
    setEditingField(null)
    setEditingValue("")
    setEditingGroupIds([])
  }

  const saveEdit = async (studentId: string, overrideValue?: string) => {
    if (!editingField) return

    const student = students.find((s) => s.id === studentId)
    if (!student) return

    // Use override value if provided (for Select components), otherwise use editingValue
    const valueToSave = overrideValue !== undefined ? overrideValue : editingValue

    // Validación: campos obligatorios no pueden estar vacíos
    if (editingField === "fullName" && !valueToSave.trim()) {
      cancelEditing()
      return
    }
    if (editingField === "email" && !valueToSave.trim()) {
      cancelEditing()
      return
    }
    if (editingField === "career" && !valueToSave) {
      // La carrera es obligatoria, no se puede dejar vacía
      cancelEditing()
      return
    }

    // Check if value actually changed (skip for groups, handled separately)
    if (editingField !== "group") {
      let currentValue: string
      switch (editingField) {
        case "fullName":
          currentValue = student.fullName
          break
        case "email":
          currentValue = student.email
          break
        case "career":
          currentValue = student.career
          break
        case "year":
          currentValue = student.year
          break
        default:
          currentValue = ""
      }

      if (valueToSave === currentValue) {
        cancelEditing()
        return
      }
    }

    setIsSavingEdit(true)

    try {
      // Build update payload
      const updatePayload: Record<string, unknown> = {}

      // Build full student payload for PUT
      updatePayload.fullName = editingField === "fullName" ? valueToSave.trim() : student.fullName
      updatePayload.email = editingField === "email" ? valueToSave.trim() : student.email
      updatePayload.career = editingField === "career" ? valueToSave : student.career
      updatePayload.year = editingField === "year" ? valueToSave : student.year
      // Keep existing groups for non-group edits
      updatePayload.groupIds = student.groups.map((g) => g.id)

      if (USE_MOCK_DATA) {
        // Update locally for mock data
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== studentId) return s
            const updated = { ...s }
            if (editingField === "fullName") updated.fullName = valueToSave.trim()
            if (editingField === "email") updated.email = valueToSave.trim()
            if (editingField === "career") updated.career = valueToSave
            if (editingField === "year") updated.year = valueToSave
            return updated
          })
        )
      } else {
        // Call API to update
        const updatedStudent = await apiClient.put<Student>(
          API_CONFIG.ENDPOINTS.STUDENT_BY_ID(studentId),
          updatePayload
        )
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? updatedStudent : s))
        )
      }

      cancelEditing()
    } catch (error) {
      console.error("Error updating student:", error)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Save groups edit (multiselect)
  const saveGroupsEdit = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (!student) return

    // Check if groups actually changed
    const currentGroupIds = student.groups.map((g) => g.id).sort()
    const newGroupIds = [...editingGroupIds].sort()
    if (JSON.stringify(currentGroupIds) === JSON.stringify(newGroupIds)) {
      cancelEditing()
      return
    }

    setIsSavingEdit(true)

    try {
      // Build full student payload for PUT
      const updatePayload = {
        fullName: student.fullName,
        email: student.email,
        career: student.career,
        year: student.year,
        groupIds: editingGroupIds,
      }

      if (USE_MOCK_DATA) {
        // Update locally for mock data
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== studentId) return s
            return {
              ...s,
              groups: editingGroupIds.map((gid) => {
                const g = groups.find((gr) => gr.id === gid)
                return { id: gid, name: g?.name || "" }
              }),
            }
          })
        )
      } else {
        // Call API to update
        const updatedStudent = await apiClient.put<Student>(
          API_CONFIG.ENDPOINTS.STUDENT_BY_ID(studentId),
          updatePayload
        )
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? updatedStudent : s))
        )
      }

      cancelEditing()
    } catch (error) {
      console.error("Error updating student groups:", error)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const toggleGroupSelection = (groupId: string) => {
    setEditingGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent, studentId: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveEdit(studentId)
    } else if (e.key === "Escape") {
      cancelEditing()
    }
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
              <FolderOpen className="h-4 w-4 text-blue-500" />
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
                const isEditing = editingStudentId === student.id
                return (
                  <div
                    key={student.id}
                    className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    {/* Nombre */}
                    <div
                      className="col-span-3 font-medium text-gray-900 truncate cursor-pointer"
                      onDoubleClick={() => startEditing(student.id, "fullName", student.fullName)}
                    >
                      {isEditing && editingField === "fullName" ? (
                        <Input
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => saveEdit(student.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id)}
                          className="h-7 text-sm"
                          disabled={isSavingEdit}
                        />
                      ) : (
                        student.fullName
                      )}
                    </div>

                    {/* Email */}
                    <div
                      className="col-span-3 text-gray-600 truncate flex items-center gap-1.5 cursor-pointer"
                      onDoubleClick={() => startEditing(student.id, "email", student.email)}
                    >
                      {isEditing && editingField === "email" ? (
                        <Input
                          autoFocus
                          type="email"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => saveEdit(student.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id)}
                          className="h-7 text-sm"
                          disabled={isSavingEdit}
                        />
                      ) : (
                        <>
                          <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </>
                      )}
                    </div>

                    {/* Grupo (multiselect) */}
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {isEditing && editingField === "group" ? (
                        <Popover
                          open={true}
                          onOpenChange={(open) => {
                            if (!open) {
                              saveGroupsEdit(student.id)
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs justify-between w-full"
                            >
                              <span className="truncate">
                                {editingGroupIds.length === 0
                                  ? "Sin grupos"
                                  : `${editingGroupIds.length} grupo${editingGroupIds.length > 1 ? "s" : ""}`}
                              </span>
                              <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2" align="start">
                            <div className="space-y-1">
                              {groups.map((g) => (
                                <label
                                  key={g.id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm"
                                >
                                  <Checkbox
                                    checked={editingGroupIds.includes(g.id)}
                                    onCheckedChange={() => toggleGroupSelection(g.id)}
                                  />
                                  <span>{g.name}</span>
                                </label>
                              ))}
                              {groups.length === 0 && (
                                <p className="text-xs text-gray-500 px-2 py-1">No hay grupos</p>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div
                          className="flex flex-wrap gap-1 cursor-pointer min-h-[28px] items-center"
                          onDoubleClick={() => startEditing(student.id, "group", "", student.groups.map((g) => g.id))}
                        >
                          {student.groups.length > 0 ? (
                            student.groups.map((g) => (
                              <Badge key={g.id} variant="secondary" className="bg-blue-50 text-blue-700 text-xs font-normal">
                                {g.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Carrera (obligatoria) */}
                    <div
                      className="col-span-3 text-gray-600 truncate cursor-pointer"
                      onDoubleClick={() => startEditing(student.id, "career", student.career)}
                    >
                      {isEditing && editingField === "career" ? (
                        <Select
                          value={editingValue}
                          onValueChange={(v) => {
                            setEditingValue(v)
                            // Pass the value directly to saveEdit to avoid state timing issues
                            saveEdit(student.id, v)
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Seleccionar carrera" />
                          </SelectTrigger>
                          <SelectContent>
                            {careers.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        student.career
                      )}
                    </div>

                    {/* Año */}
                    <div
                      className="col-span-1 text-gray-600 cursor-pointer"
                      onDoubleClick={() => startEditing(student.id, "year", student.year)}
                    >
                      {isEditing && editingField === "year" ? (
                        <Input
                          autoFocus
                          type="number"
                          min="2000"
                          max="2100"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => saveEdit(student.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id)}
                          className="h-7 text-sm w-full"
                          disabled={isSavingEdit}
                        />
                      ) : (
                        student.year || <span className="text-gray-400">—</span>
                      )}
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

      {/* Add Student Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar estudiante</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo estudiante.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input
                id="fullName"
                value={newStudentForm.fullName}
                onChange={(e) => setNewStudentForm((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Juan Pérez"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newStudentForm.email}
                onChange={(e) => setNewStudentForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="juan@ejemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="career">Carrera *</Label>
              <Select
                value={newStudentForm.career || "none"}
                onValueChange={(v) => setNewStudentForm((prev) => ({ ...prev, career: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar carrera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleccionar carrera</SelectItem>
                  {careers.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grupos</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {newStudentForm.groupIds.length === 0
                        ? "Seleccionar grupos"
                        : newStudentForm.groupIds.length === 1
                        ? groups.find((g) => g.id === newStudentForm.groupIds[0])?.name || "1 grupo"
                        : `${newStudentForm.groupIds.length} grupos`}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2" align="start">
                  <div className="space-y-1">
                    {groups.map((g) => (
                      <label
                        key={g.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={newStudentForm.groupIds.includes(g.id)}
                          onCheckedChange={(checked) => {
                            setNewStudentForm((prev) => ({
                              ...prev,
                              groupIds: checked
                                ? [...prev.groupIds, g.id]
                                : prev.groupIds.filter((id) => id !== g.id),
                            }))
                          }}
                        />
                        <span>{g.name}</span>
                      </label>
                    ))}
                    {groups.length === 0 && (
                      <p className="text-xs text-gray-500 px-2 py-1">No hay grupos disponibles</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Año de ingreso</Label>
              <Input
                id="year"
                type="number"
                min="2000"
                max="2100"
                value={newStudentForm.year}
                onChange={(e) => setNewStudentForm((prev) => ({ ...prev, year: e.target.value }))}
                placeholder={new Date().getFullYear().toString()}
              />
            </div>
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear estudiante"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Students Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={(open) => {
        setIsImportModalOpen(open)
        if (!open) {
          setImportFile(null)
          setImportResult(null)
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar estudiantes</DialogTitle>
            <DialogDescription>
              Sube un archivo JSON o CSV con la lista de estudiantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
              <input
                type="file"
                accept=".json,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-700">
                  {importFile ? importFile.name : "Seleccionar archivo"}
                </span>
                <span className="text-xs text-gray-500 mt-1">JSON o CSV</span>
              </label>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Formato esperado:</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                    <FileJson className="h-3.5 w-3.5" />
                    JSON
                  </div>
                  <pre className="bg-white p-2 rounded border text-gray-600 overflow-x-auto">
{`[{
  "full_name": "...",
  "email": "...",
  "career": "...",
  "year": 1
}]`}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    CSV
                  </div>
                  <pre className="bg-white p-2 rounded border text-gray-600 overflow-x-auto">
{`full_name,email,career,year
Juan,juan@mail.com,Ing,1`}
                  </pre>
                </div>
              </div>
            </div>

            {importResult && (
              <div className={`p-4 rounded-lg ${importResult.errors.length === 0 ? "bg-green-50" : "bg-yellow-50"}`}>
                <div className="flex items-center gap-2">
                  {importResult.errors.length === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    {importResult.success} estudiantes importados
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-sm text-yellow-700">
                    <p className="font-medium">{importResult.errors.length} errores:</p>
                    <ul className="list-disc list-inside mt-1 max-h-24 overflow-y-auto">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>
                          {err.row > 0 ? `Fila ${err.row}: ` : ""}{err.message}
                        </li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...y {importResult.errors.length - 5} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImportStudents} disabled={!importFile || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Groups Panel */}
      <Sheet open={isGroupsPanelOpen} onOpenChange={setIsGroupsPanelOpen}>
        <SheetContent className="w-full sm:max-w-md border-l border-gray-200/60 bg-gray-50/80 backdrop-blur-xl p-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base font-semibold tracking-tight text-gray-900">
                  Grupos
                </SheetTitle>
                <SheetDescription className="text-xs text-gray-500 mt-0.5">
                  {groups.length} {groups.length === 1 ? "grupo" : "grupos"}
                </SheetDescription>
              </div>
              <Button
                onClick={openCreateGroupModal}
                size="sm"
                className="h-8 px-3 text-xs font-medium bg-gray-900 hover:bg-gray-800"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nuevo
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4 h-[calc(100vh-88px)] overflow-y-auto">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Sin grupos</p>
                <p className="text-xs text-gray-500 mb-4">
                  Crea tu primer grupo para organizar estudiantes
                </p>
                <Button
                  onClick={openCreateGroupModal}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Crear grupo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => {
                  const studentCount = getStudentCountForGroup(group.id)
                  return (
                    <div
                      key={group.id}
                      className="group relative bg-white rounded-xl border border-gray-200/80 p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {group.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {group.career && (
                              <span className="inline-flex items-center text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                {group.career}
                              </span>
                            )}
                            {group.year && (
                              <span className="text-[11px] text-gray-500">
                                {group.year}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-3">
                            <div className="flex -space-x-1">
                              {[...Array(Math.min(3, studentCount))].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white"
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-gray-500 ml-1">
                              {studentCount} {studentCount === 1 ? "estudiante" : "estudiantes"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditGroupModal(group)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteGroupId(group.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create/Edit Group Modal */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Editar grupo" : "Crear grupo"}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? "Modifica los datos del grupo"
                : "Ingresa los datos del nuevo grupo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdateGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group_name">Nombre del grupo *</Label>
              <Input
                id="group_name"
                value={groupForm.name}
                onChange={(e) =>
                  setGroupForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Grupo A"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Carrera</Label>
                <Select
                  value={groupForm.career || "none"}
                  onValueChange={(v) =>
                    setGroupForm((prev) => ({ ...prev, career: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin carrera</SelectItem>
                    {careers.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="group_year">Año</Label>
                <Input
                  id="group_year"
                  type="number"
                  min="2020"
                  max="2100"
                  value={groupForm.year}
                  onChange={(e) =>
                    setGroupForm((prev) => ({ ...prev, year: e.target.value }))
                  }
                  placeholder={new Date().getFullYear().toString()}
                />
              </div>
            </div>
            {groupFormError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {groupFormError}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGroupModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isGroupSubmitting}>
                {isGroupSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingGroup ? "Guardando..." : "Creando..."}
                  </>
                ) : editingGroup ? (
                  "Guardar cambios"
                ) : (
                  "Crear grupo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los estudiantes del grupo no serán eliminados, solo perderán su asignación al grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isDeletingGroup}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingGroup ? (
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
