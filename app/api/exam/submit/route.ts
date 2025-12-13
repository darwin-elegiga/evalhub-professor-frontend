import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignment_id } = body

    if (USE_MOCK_DATA) {
      // Update assignment status to submitted
      const assignmentIndex = MOCK_DATA.assignments.findIndex(
        (a) => a.id === assignment_id
      )

      if (assignmentIndex >= 0) {
        MOCK_DATA.assignments[assignmentIndex] = {
          ...MOCK_DATA.assignments[assignmentIndex],
          status: "submitted",
          submitted_at: new Date().toISOString(),
        }
      }

      return NextResponse.json({
        success: true,
        assignment: MOCK_DATA.assignments[assignmentIndex],
      })
    } else {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ASSIGNMENTS_SUBMIT, body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error submitting exam:", error)
    return NextResponse.json(
      { error: "Error submitting exam" },
      { status: 500 }
    )
  }
}
