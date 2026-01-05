"use client"

import type React from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { ApiError } from "@/lib/api-config"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Credenciales incorrectas. Verifica tu email y contraseña."
      case 404:
        return "No existe una cuenta con este email."
      case 429:
        return "Demasiados intentos. Espera unos minutos."
      case 500:
        return "Error del servidor. Intenta más tarde."
      default:
        return error.message || "Error al iniciar sesión."
    }
  }
  if (error instanceof Error) {
    if (error.message.includes("fetch")) {
      return "No se pudo conectar con el servidor."
    }
    return error.message
  }
  return "Ocurrió un error inesperado."
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(email, password, rememberMe)
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Visual */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-4">
            <Image
              src="/isotipo.png"
              alt="Universidad de Oriente"
              width={60}
              height={60}
              className="rounded-full bg-white p-1"
            />
            <div>
              <p className="font-semibold text-lg">Universidad de Oriente</p>
              <p className="text-blue-200 text-sm">Sistema de Evaluación</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Plataforma de Evaluación Académica
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              Gestiona tus exámenes, evalúa a tus estudiantes y optimiza
              el proceso de calificación de manera eficiente.
            </p>
          </div>

          <p className="text-blue-300 text-sm">
            © 2025 Universidad de Oriente - Santiago de Cuba
          </p>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <Image
              src="/isotipo.png"
              alt="Universidad de Oriente"
              width={70}
              height={70}
              className="mb-3"
            />
            <p className="text-gray-600 text-sm">Sistema de Evaluación</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Iniciar sesión
            </h2>
            <p className="text-gray-500">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@uo.edu.cu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-4 pr-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Recordar sesión */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  rememberMe
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <label
                onClick={() => setRememberMe(!rememberMe)}
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                Recordar sesión
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-sm text-gray-400">o</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Link registro */}
          <p className="text-center text-gray-600">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
