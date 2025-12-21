"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

const PAGE_CONFIG: Record<
  string,
  { title: string; action?: { label: string; href: string } }
> = {
  "/dashboard": {
    title: "Panel de Control",
  },
  "/dashboard/exams": {
    title: "Exámenes",
    action: { label: "Nuevo Examen", href: "/dashboard/exams/create" },
  },
  "/dashboard/exams/create": {
    title: "Crear Examen",
  },
  "/dashboard/questions": {
    title: "Banco de Preguntas",
    action: { label: "Nueva Pregunta", href: "/dashboard/questions/create" },
  },
  "/dashboard/questions/create": {
    title: "Nueva Pregunta",
  },
  "/dashboard/students": {
    title: "Estudiantes",
    action: { label: "Nuevo Estudiante", href: "/dashboard/students/create" },
  },
  "/dashboard/grades": {
    title: "Calificaciones",
  },
}

function getPageConfig(pathname: string) {
  // Exact match first
  if (PAGE_CONFIG[pathname]) {
    return PAGE_CONFIG[pathname]
  }

  // Check for dynamic routes
  if (pathname.startsWith("/dashboard/exams/") && pathname.includes("/assign")) {
    return { title: "Asignar Examen" }
  }
  if (pathname.startsWith("/dashboard/exams/") && pathname.includes("/results")) {
    return { title: "Resultados del Examen" }
  }
  if (pathname.startsWith("/dashboard/exams/")) {
    return { title: "Detalle del Examen" }
  }
  if (pathname.startsWith("/dashboard/grades/")) {
    return { title: "Calificar Examen" }
  }
  if (pathname.startsWith("/dashboard/questions/")) {
    return { title: "Editar Pregunta" }
  }

  return { title: "Dashboard" }
}

export function DashboardHeader() {
  const pathname = usePathname()
  const config = getPageConfig(pathname)

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-sm font-medium text-gray-900">{config.title}</h1>
      {config.action && (
        <Button asChild size="sm">
          <Link href={config.action.href}>
            <Plus className="mr-2 h-4 w-4" />
            {config.action.label}
          </Link>
        </Button>
      )}
    </header>
  )
}
