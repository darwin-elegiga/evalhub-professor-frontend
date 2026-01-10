import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface GradingDataResponse {
  assignment: any
  student: any
  exam: any
  questions: any[]
  answers: any[]
  events: any[]
  existingGrade: any | null
}

// GET /api/assignments/[id]/grading - Get full grading data for an assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { id } = await params
    const response = await serverFetch<GradingDataResponse>(API_CONFIG.ENDPOINTS.ASSIGNMENT_GRADING(id), {
      method: "GET",
      token,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching grading data:", error)
    return NextResponse.json({ error: "Error fetching grading data" }, { status: 500 })
  }
}
