import type { Exam, Student, StudentGroup } from "./types"

// Types for dashboard statistics
export interface DashboardStats {
  exams: number
  students: number
  assignments: number
  pending: number
  questions: number
  groups: number
}

export interface Assignment {
  id: string
  status: "pending" | "in_progress" | "submitted" | "graded"
  [key: string]: unknown
}

// Calculate exam statistics
export function calculateExamStats(exams: Exam[]): number {
  return exams?.length || 0
}

// Calculate student statistics
export function calculateStudentStats(students: Student[]): number {
  return students?.length || 0
}

// Calculate group statistics
export function calculateGroupStats(groups: StudentGroup[]): number {
  return groups?.length || 0
}

// Calculate assignment statistics
export function calculateAssignmentStats(assignments: Assignment[]): {
  total: number
  pending: number
  submitted: number
  graded: number
  inProgress: number
} {
  if (!assignments || !Array.isArray(assignments)) {
    return { total: 0, pending: 0, submitted: 0, graded: 0, inProgress: 0 }
  }

  return {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
    inProgress: assignments.filter((a) => a.status === "in_progress").length,
  }
}

// Calculate questions statistics
export function calculateQuestionStats(questions: unknown[]): number {
  return questions?.length || 0
}

// Safe fetch with fallback - fetches data and returns empty array on error
export async function safeFetch<T>(
  fetchFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fetchFn()
  } catch (error) {
    console.error("Error fetching data:", error)
    return fallback
  }
}

// Load all dashboard stats with individual error handling
export async function loadDashboardStats(
  fetchExams: () => Promise<Exam[]>,
  fetchStudents: () => Promise<Student[]>,
  fetchAssignments: () => Promise<Assignment[]>,
  fetchQuestions?: () => Promise<unknown[]>,
  fetchGroups?: () => Promise<StudentGroup[]>
): Promise<DashboardStats> {
  // Fetch all data in parallel with individual error handling
  const [exams, students, assignments, questions, groups] = await Promise.all([
    safeFetch(fetchExams, []),
    safeFetch(fetchStudents, []),
    safeFetch(fetchAssignments, []),
    fetchQuestions ? safeFetch(fetchQuestions, []) : Promise.resolve([]),
    fetchGroups ? safeFetch(fetchGroups, []) : Promise.resolve([]),
  ])

  const assignmentStats = calculateAssignmentStats(assignments)

  return {
    exams: calculateExamStats(exams),
    students: calculateStudentStats(students),
    assignments: assignmentStats.total,
    pending: assignmentStats.submitted, // "submitted" means pending review
    questions: calculateQuestionStats(questions),
    groups: calculateGroupStats(groups),
  }
}

// Format number for display (e.g., 1000 -> 1K)
export function formatStatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

// Get status color for assignments
export function getAssignmentStatusColor(status: Assignment["status"]): string {
  switch (status) {
    case "pending":
      return "text-gray-500"
    case "in_progress":
      return "text-blue-500"
    case "submitted":
      return "text-amber-500"
    case "graded":
      return "text-green-500"
    default:
      return "text-gray-500"
  }
}

// Get status label in Spanish
export function getAssignmentStatusLabel(status: Assignment["status"]): string {
  switch (status) {
    case "pending":
      return "Pendiente"
    case "in_progress":
      return "En progreso"
    case "submitted":
      return "Entregado"
    case "graded":
      return "Calificado"
    default:
      return "Desconocido"
  }
}
