"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Teacher } from "./types";
import { apiClient } from "./api-client";
import { API_CONFIG } from "./api-config";

// Respuesta del backend para login/register
interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface AuthContextType {
  user: Teacher | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper para acceder al storage de forma segura
const getStorageItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  // Primero buscar en localStorage, luego en sessionStorage
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

const setStorageItem = (
  key: string,
  value: string,
  persistent: boolean = true
): void => {
  if (typeof window === "undefined") return;
  if (persistent) {
    localStorage.setItem(key, value);
  } else {
    sessionStorage.setItem(key, value);
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

// Helper para mapear respuesta del backend a Teacher
const mapAuthResponseToTeacher = (response: AuthResponse): Teacher => ({
  id: response.user.id,
  email: response.user.email,
  full_name: `${response.user.firstName} ${response.user.lastName}`,
  created_at: response.user.createdAt,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = getStorageItem("auth_token");
      if (token) {
        const userData = await apiClient.get<Teacher>(API_CONFIG.ENDPOINTS.ME);
        setUser(userData);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      removeStorageItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    // Modo real: llamar al backend
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.LOGIN,
        {
          email,
          password,
        }
      );
      setStorageItem("auth_token", response.tokens.accessToken, rememberMe);
      setStorageItem("refresh_token", response.tokens.refreshToken, rememberMe);
      setUser(mapAuthResponseToTeacher(response));
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    // Modo real: llamar al backend
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.REGISTER,
        {
          email,
          password,
          firstName,
          lastName,
        }
      );
      setStorageItem("auth_token", response.tokens.accessToken);
      setStorageItem("refresh_token", response.tokens.refreshToken);
      setUser(mapAuthResponseToTeacher(response));
      router.push("/dashboard");
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      removeStorageItem("auth_token");
      removeStorageItem("refresh_token");
      setUser(null);
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
