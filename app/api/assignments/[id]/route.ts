import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentExamAssignment } from "@/lib/types"

// GET /api/assignments/[id] - Get assignment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const assignment = MOCK_DATA.assignments?.find((a: StudentExamAssignment) => a.id === id)
      if (!assignment) {
        return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
      }
      return NextResponse.json(assignment)
    } else {
      const response = await apiClient.get<StudentExamAssignment>(API_CONFIG.ENDPOINTS.ASSIGNMENT_BY_ID(id))
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching assignment:", error)
    return NextResponse.json({ error: "Error fetching assignment" }, { status: 500 })
  }
}
