"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Exam, Student } from "@/lib/types"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssignExamForm } from "@/components/assign-exam-form"
import Link from "next/link"

export default function AssignExamPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && examId) {
      loadData()
    }
  }, [user, examId])

  const loadData = async () => {
    try {
      if (USE_MOCK_DATA) {
        const foundExam = MOCK_DATA.exams.find((e) => e.id === examId)
        setExam(foundExam || null)
        setStudents(MOCK_DATA.students)
      } else {
        const [examData, studentsData] = await Promise.all([
          apiClient.get<Exam>(`${API_CONFIG.ENDPOINTS.EXAMS}/${examId}`),
          apiClient.get<Student[]>(API_CONFIG.ENDPOINTS.STUDENTS),
        ])
        setExam(examData)
        setStudents(studentsData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard/exams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Exámenes
            </Link>
          </Button>
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
            <p className="text-muted-foreground">Examen no encontrado</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href={`/dashboard/exams/${examId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Examen
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Asignar Examen</h1>
          <p className="text-muted-foreground">
            Asigna &quot;{exam.title}&quot; a tus estudiantes
          </p>
        </div>

        <AssignExamForm exam={exam} students={students} />
      </div>
    </div>
  )
}
