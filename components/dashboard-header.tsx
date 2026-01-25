"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Menu, Plus, MoreVertical } from "lucide-react"
import { useHeaderActions } from "@/lib/header-actions-context"
import { useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:hidden"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-medium text-gray-900">{config.title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Single primary action */}
        {actions.length === 1 && (
          <Button
            size="sm"
            onClick={actions[0].onClick}
            className="px-2 sm:px-3"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{actions[0].label}</span>
          </Button>
        )}
        {/* Multiple actions: primary button + dropdown for rest */}
        {actions.length > 1 && (
          <>
            <Button
              size="sm"
              onClick={actions[0].onClick}
              className="px-2 sm:px-3"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{actions[0].label}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="px-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.slice(1).map((action, index) => (
                  <DropdownMenuItem key={index} onClick={action.onClick}>
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        {/* Default link-based action if no context actions */}
        {actions.length === 0 && config.defaultAction && (
          <Button asChild size="sm" className="px-2 sm:px-3">
            <Link href={config.defaultAction.href}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{config.defaultAction.label}</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}
