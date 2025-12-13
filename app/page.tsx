import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, BarChart3, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            <Sparkles className="h-4 w-4" />
            Plataforma de Exámenes Científicos
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 md:text-6xl">
            Crea Exámenes de Ciencias
            <span className="block text-indigo-600">con Ecuaciones y Gráficos</span>
          </h1>

          <p className="mb-10 text-xl text-gray-600 leading-relaxed">
            Una plataforma moderna para profesores que permite crear exámenes interactivos con soporte completo para
            ecuaciones LaTeX, imágenes, gráficos y gestión avanzada de estudiantes.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="min-w-[200px]">
              <Link href="/auth/sign-up">Comenzar Gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[200px] bg-transparent">
              <Link href="/auth/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Exámenes Avanzados</h3>
            <p className="text-gray-600">
              Crea exámenes con ecuaciones LaTeX, imágenes, gráficos y múltiples niveles de dificultad.
            </p>
          </div>

          <div className="rounded-lg bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Gestión de Estudiantes</h3>
            <p className="text-gray-600">
              Administra estudiantes, asigna exámenes con magic links únicos y realiza seguimiento en tiempo real.
            </p>
          </div>

          <div className="rounded-lg bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Sistema de Calificaciones</h3>
            <p className="text-gray-600">
              Califica automáticamente y manualmente, proporciona retroalimentación detallada y genera reportes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
