import { API_CONFIG, ApiError } from "./api-config"

// Helper para acceder al storage de forma segura (localStorage o sessionStorage)
const getToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
}

const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token")
}

// Determinar en qué storage guardar (mantener consistencia con donde está el token actual)
const getActiveStorage = (): Storage | null => {
  if (typeof window === "undefined") return null
  if (localStorage.getItem("auth_token")) return localStorage
  if (sessionStorage.getItem("auth_token")) return sessionStorage
  return sessionStorage // Default a sessionStorage si no hay token
}

const setToken = (token: string): void => {
  const storage = getActiveStorage()
  if (storage) storage.setItem("auth_token", token)
}

const setRefreshToken = (token: string): void => {
  const storage = getActiveStorage()
  if (storage) storage.setItem("refresh_token", token)
}

const clearTokens = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth_token")
  localStorage.removeItem("refresh_token")
  sessionStorage.removeItem("auth_token")
  sessionStorage.removeItem("refresh_token")
}

// Flag para evitar múltiples refresh simultáneos
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

// Función para renovar el token
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      return false
    }

    const data = await response.json()
    setToken(data.tokens.accessToken)
    setRefreshToken(data.tokens.refreshToken)
    return true
  } catch {
    clearTokens()
    return false
  }
}

// Helper para hacer fetch con manejo de errores y refresh automático
async function fetchApi<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  }

  // Agregar token si existe (solo en cliente)
  const token = getToken()
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  // Endpoints de autenticación que no deben intentar refresh
  const authEndpoints = [
    API_CONFIG.ENDPOINTS.LOGIN,
    API_CONFIG.ENDPOINTS.REGISTER,
    API_CONFIG.ENDPOINTS.REFRESH,
  ]
  const isAuthEndpoint = authEndpoints.includes(endpoint)

  // Si el token expiró (401) y NO es un endpoint de auth, intentar refresh
  if (response.status === 401 && retry && !isAuthEndpoint) {
    // Evitar múltiples refresh simultáneos
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = refreshAccessToken()
    }

    const refreshSuccess = await refreshPromise
    isRefreshing = false
    refreshPromise = null

    if (refreshSuccess) {
      // Reintentar la petición original con el nuevo token
      return fetchApi<T>(endpoint, options, false)
    } else {
      // Redirigir al login si el refresh falla
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login"
      }
      throw new ApiError(401, "Sesión expirada")
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error desconocido" }))
    throw new ApiError(response.status, error.message || "Error en la petición", error)
  }

  return response.json()
}

export const apiClient = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: any) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: any) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: any) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, { method: 'DELETE' }),
}

// Server-side API client for use in API routes (receives token as parameter)
export async function serverFetch<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options
  const url = `${API_CONFIG.BASE_URL}${endpoint}`

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...fetchOptions.headers,
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error desconocido" }))
    throw new ApiError(response.status, error.message || "Error en la petición", error)
  }

  return response.json()
}
