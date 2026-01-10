import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { ExamDefaultConfig } from "@/lib/types"

// Default configuration values (fallback) - using camelCase
const DEFAULT_EXAM_CONFIG: ExamDefaultConfig = {
  shuffleQuestions: false,
  shuffleOptions: true,
  showResultsImmediately: false,
  penaltyEnabled: false,
  penaltyValue: 0.25,
  passingPercentage: 60,
}

// GET /api/config/exam-defaults - Get default exam configuration
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const response = await serverFetch<ExamDefaultConfig>(API_CONFIG.ENDPOINTS.EXAM_DEFAULT_CONFIG, {
      method: "GET",
      token,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching exam default config:", error)
    // Return default values as fallback
    return NextResponse.json(DEFAULT_EXAM_CONFIG)
  }
}
