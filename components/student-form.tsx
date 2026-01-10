"use client"

import type React from "react"

import { useState } from "react"
import { authFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"

interface StudentFormProps {
  teacherId: string
  student?: {
    id: string
    full_name: string
    email: string
  }
}

export function StudentForm({ teacherId, student }: StudentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState(student?.full_name || "")
  const [email, setEmail] = useState(student?.email || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = student ? `/api/students/${student.id}` : "/api/students/create"
      const method = student ? "PUT" : "POST"

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacherId,
          full_name: fullName,
          email,
        }),
      })

      if (!response.ok) throw new Error("Error saving student")

      router.push("/dashboard/students")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving student:", error)
      alert("Error al guardar el estudiante")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{student ? "Editar Estudiante" : "Nuevo Estudiante"}</CardTitle>
        <CardDescription>
          {student ? "Actualiza la información del estudiante" : "Completa los datos del estudiante"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input
              id="fullName"
              placeholder="Juan Pérez"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="estudiante@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
