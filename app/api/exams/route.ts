import { NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Exam } from "@/lib/types"

// GET /api/exams - List all exams
export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_DATA.exams)
    } else {
      const response = await apiClient.get<Exam[]>(API_CONFIG.ENDPOINTS.EXAMS)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching exams:", error)
    return NextResponse.json({ error: "Error fetching exams" }, { status: 500 })
  }
}
