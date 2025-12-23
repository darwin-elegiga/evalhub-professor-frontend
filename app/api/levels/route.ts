import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { ExamLevel } from "@/lib/types"

// GET /api/levels - List all levels
export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_DATA.levels)
    } else {
      const response = await apiClient.get<ExamLevel[]>(API_CONFIG.ENDPOINTS.LEVELS)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching levels:", error)
    return NextResponse.json({ error: "Error fetching levels" }, { status: 500 })
  }
}

// POST /api/levels - Create a new level
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const newLevel: ExamLevel = {
        id: crypto.randomUUID(),
        teacher_id: body.teacher_id || "1",
        name: body.name,
        description: body.description || null,
        created_at: new Date().toISOString(),
      }

      MOCK_DATA.levels.push(newLevel)
      return NextResponse.json(newLevel, { status: 201 })
    } else {
      const response = await apiClient.post<ExamLevel>(API_CONFIG.ENDPOINTS.LEVELS, body)
      return NextResponse.json(response, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating level:", error)
    return NextResponse.json({ error: "Error creating level" }, { status: 500 })
  }
}
