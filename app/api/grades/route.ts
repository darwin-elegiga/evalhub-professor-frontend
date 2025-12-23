import { NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Grade } from "@/lib/types"

// GET /api/grades - List all grades
export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_DATA.grades || [])
    } else {
      const response = await apiClient.get<Grade[]>(API_CONFIG.ENDPOINTS.GRADES)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching grades:", error)
    return NextResponse.json({ error: "Error fetching grades" }, { status: 500 })
  }
}
