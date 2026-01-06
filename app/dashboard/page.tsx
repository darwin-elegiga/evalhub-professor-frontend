"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FileText,
  Users,
  ClipboardCheck,
  Clock,
  Plus,
  ArrowUpRight,
  HelpCircle,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import {
  type DashboardStats,
  type Assignment,
  safeFetch,
  calculateAssignmentStats,
} from "@/lib/dashboard-utils"
import type { Exam, Student, BankQuestion } from "@/lib/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    exams: 0,
    students: 0,
    assignments: 0,
    pending: 0,
    questions: 0,
    groups: 0,
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      if (USE_MOCK_DATA) {
        setStats({
          exams: MOCK_DATA.exams.length,
          students: MOCK_DATA.students.length,
          assignments: MOCK_DATA.assignments.length,
          pending: MOCK_DATA.assignments.filter((a) => a.status === "submitted").length,
          questions: MOCK_DATA.bankQuestions?.length || 0,
          groups: MOCK_DATA.studentGroups?.length || 0,
        })
      } else {
        // Fetch each endpoint independently to handle partial failures
        const [exams, students, assignments, questions] = await Promise.all([
          safeFetch(() => apiClient.get<Exam[]>(API_CONFIG.ENDPOINTS.EXAMS), []),
          safeFetch(() => apiClient.get<Student[]>(API_CONFIG.ENDPOINTS.STUDENTS), []),
          safeFetch(() => apiClient.get<Assignment[]>(API_CONFIG.ENDPOINTS.ASSIGNMENTS), []),
          safeFetch(() => apiClient.get<BankQuestion[]>(API_CONFIG.ENDPOINTS.QUESTIONS), []),
        ])

        const assignmentStats = calculateAssignmentStats(assignments)

        setStats({
          exams: exams.length,
          students: students.length,
          assignments: assignmentStats.total,
          pending: assignmentStats.submitted, // "submitted" = pending review
          questions: questions.length,
          groups: 0, // Groups are loaded separately if needed
        })
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setTimeout(() => setIsLoaded(true), 50)
    }
  }

  const metrics = [
    { label: "Exámenes", value: stats.exams, href: "/dashboard/exams" },
    { label: "Preguntas", value: stats.questions, href: "/dashboard/questions" },
    { label: "Estudiantes", value: stats.students, href: "/dashboard/students" },
    { label: "Pendientes", value: stats.pending, href: "/dashboard/grades", alert: stats.pending > 0 },
  ]

  const navigation = [
    {
      title: "Exámenes",
      description: "Crear, editar y gestionar evaluaciones",
      href: "/dashboard/exams",
      icon: FileText,
    },
    {
      title: "Banco de Preguntas",
      description: "Crear y gestionar preguntas reutilizables",
      href: "/dashboard/questions",
      icon: HelpCircle,
    },
    {
      title: "Estudiantes",
      description: "Administrar lista de estudiantes",
      href: "/dashboard/students",
      icon: Users,
    },
    {
      title: "Calificaciones",
      description: "Revisar y calificar entregas",
      href: "/dashboard/grades",
      icon: ClipboardCheck,
    },
  ]

  return (
    <main className="flex-1 overflow-auto bg-gray-50/50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Welcome */}
        <div
          className={`transition-all duration-300 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <h1 className="text-xl font-medium text-gray-900">
            Bienvenido, {user?.full_name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen de tu actividad en la plataforma
          </p>
        </div>

          {/* Metrics */}
          <div
            className={`mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-4 transition-all duration-300 ease-out ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "75ms" }}
          >
            {metrics.map((metric) => (
              <Link
                key={metric.label}
                href={metric.href}
                className="group relative bg-white p-5 transition-colors hover:bg-gray-50"
              >
                <dt className="text-xs font-medium text-gray-500">
                  {metric.label}
                </dt>
                <dd
                  className={`mt-1 text-2xl font-semibold tabular-nums ${
                    metric.alert ? "text-amber-600" : "text-gray-900"
                  }`}
                >
                  {metric.value}
                </dd>
                {metric.alert && (
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-500" />
                )}
              </Link>
            ))}
          </div>

          {/* Alert Banner */}
          {stats.pending > 0 && (
            <div
              className={`mt-6 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 transition-all duration-300 ease-out ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "150ms" }}
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  {stats.pending} evaluación{stats.pending > 1 ? "es" : ""} pendiente{stats.pending > 1 ? "s" : ""} de revisión
                </span>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800 hover:bg-amber-100">
                <Link href="/dashboard/grades">
                  Revisar
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          )}

          {/* Quick Action */}
          <div
            className={`mt-8 transition-all duration-300 ease-out ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <Button asChild>
              <Link href="/dashboard/exams/create">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Examen
              </Link>
            </Button>
          </div>

          {/* Navigation */}
          <div
            className={`mt-10 transition-all duration-300 ease-out ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "275ms" }}
          >
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Navegación
            </h2>
            <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
              {navigation.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-gray-200 group-hover:text-gray-700">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>
    </main>
  )
}
