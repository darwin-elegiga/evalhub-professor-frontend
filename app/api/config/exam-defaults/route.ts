import { NextResponse } from "next/server"
import { USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { ExamDefaultConfig } from "@/lib/types"

// Default configuration values (fallback)
const DEFAULT_EXAM_CONFIG: ExamDefaultConfig = {
  shuffle_questions: false,
  shuffle_options: true,
  show_results_immediately: false,
  penalty_enabled: false,
  penalty_value: 0.25,
  passing_percentage: 60,
}

// GET /api/config/exam-defaults - Get default exam configuration
export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json(DEFAULT_EXAM_CONFIG)
    } else {
      const response = await apiClient.get<ExamDefaultConfig>(API_CONFIG.ENDPOINTS.EXAM_DEFAULT_CONFIG)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching exam default config:", error)
    // Return default values as fallback
    return NextResponse.json(DEFAULT_EXAM_CONFIG)
  }
}
