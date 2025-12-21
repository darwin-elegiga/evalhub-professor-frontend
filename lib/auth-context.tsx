"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { Teacher } from "./types"
import { apiClient } from "./api-client"
import { API_CONFIG } from "./api-config"
import { MOCK_DATA, USE_MOCK_DATA } from "./mock-data"

interface AuthContextType {
  user: Teacher | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper para acceder a localStorage de forma segura
const getStorageItem = (key: string): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(key)
}

const setStorageItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(key, value)
}

const removeStorageItem = (key: string): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem(key)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      if (USE_MOCK_DATA) {
        // Modo mock: usar datos simulados
        const token = getStorageItem("auth_token")
        if (token === "mock_token") {
          setUser(MOCK_DATA.teacher)
        }
      } else {
        // Modo real: consultar al backend
        const token = getStorageItem("auth_token")
        if (token) {
          const userData = await apiClient.get<Teacher>(API_CONFIG.ENDPOINTS.ME)
          setUser(userData)
        }
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      removeStorageItem("auth_token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    if (USE_MOCK_DATA) {
      // Modo mock: simular login (siempre exitoso)
      await new Promise((resolve) => setTimeout(resolve, 300))
      setStorageItem("auth_token", "mock_token")
      setUser(MOCK_DATA.teacher)
      router.push("/dashboard")
      return
    }

    // Modo real: llamar al backend
    try {
      const response = await apiClient.post<{ token: string; user: Teacher }>(API_CONFIG.ENDPOINTS.LOGIN, {
        email,
        password,
      })
      setStorageItem("auth_token", response.token)
      setUser(response.user)
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, fullName: string) => {
    if (USE_MOCK_DATA) {
      // Modo mock: simular registro (siempre exitoso)
      await new Promise((resolve) => setTimeout(resolve, 300))
      setStorageItem("auth_token", "mock_token")
      setUser({ ...MOCK_DATA.teacher, email, full_name: fullName })
      router.push("/dashboard")
      return
    }

    // Modo real: llamar al backend
    try {
      const response = await apiClient.post<{ token: string; user: Teacher }>(API_CONFIG.ENDPOINTS.REGISTER, {
        email,
        password,
        fullName,
      })
      setStorageItem("auth_token", response.token)
      setUser(response.user)
      router.push("/dashboard")
    } catch (error) {
      console.error("Register error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (!USE_MOCK_DATA) {
        await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      removeStorageItem("auth_token")
      setUser(null)
      router.push("/")
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
