import { NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentExamAssignment } from "@/lib/types"

// GET /api/assignments - List all assignments
export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_DATA.assignments || [])
    } else {
      const response = await apiClient.get<StudentExamAssignment[]>(API_CONFIG.ENDPOINTS.ASSIGNMENTS)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ error: "Error fetching assignments" }, { status: 500 })
  }
}
