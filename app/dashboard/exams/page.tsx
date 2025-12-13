"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Exam, ExamLevel } from "@/lib/types"
import { ArrowLeft, Plus, Eye, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function ExamsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [levels, setLevels] = useState<ExamLevel[]>([])
  const [loadingExams, setLoadingExams] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      if (USE_MOCK_DATA) {
        setExams(MOCK_DATA.exams)
        setLevels(MOCK_DATA.levels)
      } else {
        const [examsData, levelsData] = await Promise.all([
          apiClient.get<Exam[]>(API_CONFIG.ENDPOINTS.EXAMS),
          apiClient.get<ExamLevel[]>(API_CONFIG.ENDPOINTS.LEVELS),
        ])
        setExams(examsData)
        setLevels(levelsData)
      }
    } catch (error) {
      console.error("Error loading exams:", error)
    } finally {
      setLoadingExams(false)
    }
  }

  const getLevelName = (levelId: string | null) => {
    if (!levelId) return null
    const level = levels.find((l) => l.id === levelId)
    return level?.name || null
  }

  if (loading || loadingExams) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Exámenes</h1>
            <p className="text-muted-foreground">
              Gestiona y administra tus exámenes
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/exams/create">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Examen
            </Link>
          </Button>
        </div>

        {exams.length === 0 ? (
          <Card>
            <CardContent className="flex h-64 flex-col items-center justify-center">
              <p className="mb-4 text-muted-foreground">
                No tienes exámenes creados todavía
              </p>
              <Button asChild>
                <Link href="/dashboard/exams/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear tu primer examen
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    {getLevelName(exam.level_id) && (
                      <Badge variant="secondary">
                        {getLevelName(exam.level_id)}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {exam.description || "Sin descripción"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-sm text-muted-foreground">
                    {exam.duration_minutes && (
                      <p>Duración: {exam.duration_minutes} minutos</p>
                    )}
                    <p>
                      Creado:{" "}
                      {new Date(exam.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/dashboard/exams/${exam.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/dashboard/exams/${exam.id}/assign`}>
                        <Send className="mr-2 h-4 w-4" />
                        Asignar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
