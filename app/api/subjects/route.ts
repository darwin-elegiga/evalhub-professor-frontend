import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Subject } from "@/lib/types"

// GET /api/subjects - List all subjects
export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_DATA.subjects || [])
    } else {
      const response = await apiClient.get<Subject[]>(API_CONFIG.ENDPOINTS.SUBJECTS)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json({ error: "Error fetching subjects" }, { status: 500 })
  }
}

// POST /api/subjects - Create a new subject
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const newSubject: Subject = {
        id: crypto.randomUUID(),
        teacher_id: body.teacher_id || "1",
        name: body.name,
        description: body.description || null,
        color: body.color || "blue",
        created_at: new Date().toISOString(),
      }

      if (!MOCK_DATA.subjects) {
        (MOCK_DATA as any).subjects = []
      }
      MOCK_DATA.subjects.push(newSubject)

      return NextResponse.json(newSubject, { status: 201 })
    } else {
      const response = await apiClient.post<Subject>(API_CONFIG.ENDPOINTS.SUBJECTS, body)
      return NextResponse.json(response, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json({ error: "Error creating subject" }, { status: 500 })
  }
}
