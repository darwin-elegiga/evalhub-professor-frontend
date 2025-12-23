import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentGroup } from "@/lib/types"

// GET /api/groups - List all groups
export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_DATA.studentGroups)
    } else {
      const response = await apiClient.get<StudentGroup[]>(API_CONFIG.ENDPOINTS.GROUPS)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json({ error: "Error fetching groups" }, { status: 500 })
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const newGroup: StudentGroup = {
        id: crypto.randomUUID(),
        teacher_id: body.teacher_id || "1",
        name: body.name,
        year: body.year,
        career: body.career,
        created_at: new Date().toISOString(),
      }

      MOCK_DATA.studentGroups.push(newGroup)
      return NextResponse.json(newGroup, { status: 201 })
    } else {
      const response = await apiClient.post<StudentGroup>(API_CONFIG.ENDPOINTS.GROUPS, body)
      return NextResponse.json(response, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json({ error: "Error creating group" }, { status: 500 })
  }
}
