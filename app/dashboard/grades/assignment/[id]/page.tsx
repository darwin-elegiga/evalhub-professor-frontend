"use client"

import { useAuth } from "@/lib/auth-context"
import { authFetch } from "@/lib/api-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { GradingInterface } from "@/components/grading-interface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { GradingDataResponse } from "@/lib/api-types"

export default function GradingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  const [gradingData, setGradingData] = useState<GradingDataResponse | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && assignmentId) {
      loadData()
    }
  }, [user, assignmentId])

  const loadData = async () => {
    try {
      const res = await authFetch(`/api/assignments/${assignmentId}/grading`)
      const data: GradingDataResponse = await res.json()
      setGradingData(data)
    } catch (error) {
      console.error("Error loading grading data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!gradingData) {
    return (
      <div className="bg-gray-100">
        <div className="container mx-auto p-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard/grades">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Calificaciones
            </Link>
          </Button>
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Asignación no encontrada</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto p-6">
        <GradingInterface
          assignment={gradingData.assignment}
          questions={gradingData.questions}
          existingGrade={gradingData.existingGrade}
          teacherId={user.id}
          examEvents={gradingData.examEvents}
        />
      </div>
    </div>
  )
}
