"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus } from "lucide-react"
import { StudentsTable } from "@/components/students-table"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import type { Student } from "@/lib/types"

export default function StudentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  const loadStudents = async () => {
    try {
      if (USE_MOCK_DATA) {
        setStudents(MOCK_DATA.students)
      } else {
        const data = await apiClient.get<Student[]>(API_CONFIG.ENDPOINTS.STUDENTS)
        setStudents(data)
      }
    } catch (error) {
      console.error("Error loading students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Estudiantes</h1>
            <p className="text-muted-foreground">Administra tu lista de estudiantes</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/students/create">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Estudiante
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Estudiantes</CardTitle>
            <CardDescription>Total: {students?.length || 0} estudiantes</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentsTable students={students || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
