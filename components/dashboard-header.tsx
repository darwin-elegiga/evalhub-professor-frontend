"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useHeaderActions } from "@/lib/header-actions-context"

const PAGE_CONFIG: Record<
  string,
  { title: string; defaultAction?: { label: string; href: string } }
> = {
  "/dashboard": {
    title: "Panel de Control",
  },
  "/dashboard/exams": {
    title: "Exámenes",
    defaultAction: { label: "Nuevo Examen", href: "/dashboard/exams/create" },
  },
  "/dashboard/exams/create": {
    title: "Crear Examen",
  },
  "/dashboard/questions": {
    title: "Banco de Preguntas",
    defaultAction: { label: "Nueva Pregunta", href: "/dashboard/questions/create" },
  },
  "/dashboard/questions/create": {
    title: "Nueva Pregunta",
  },
  "/dashboard/students": {
    title: "Estudiantes",
  },
  "/dashboard/grades": {
    title: "Calificaciones",
  },
  "/dashboard/subjects": {
    title: "Mis Asignaturas",
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
  const { actions } = useHeaderActions()

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-sm font-medium text-gray-900">{config.title}</h1>
      <div className="flex items-center gap-2">
        {/* Context actions from pages */}
        {actions.map((action, index) => (
          <Button key={index} size="sm" variant={index === 0 ? "default" : "outline"} onClick={action.onClick}>
            {index === 0 && <Plus className="mr-2 h-4 w-4" />}
            {action.label}
          </Button>
        ))}
        {/* Default link-based action if no context actions */}
        {actions.length === 0 && config.defaultAction && (
          <Button asChild size="sm">
            <Link href={config.defaultAction.href}>
              <Plus className="mr-2 h-4 w-4" />
              {config.defaultAction.label}
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}
