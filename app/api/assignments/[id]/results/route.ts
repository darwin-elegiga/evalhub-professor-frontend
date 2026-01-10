import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"

interface ExamResultsResponse {
  examAssignment: any
  exam: any
  group: any | null
  studentAssignments: Array<{
    assignment: any
    student: any
    grade: any | null
  }>
  stats: {
    total: number
    submitted: number
    graded: number
    pending: number
    averageScore: number | null
  }
}

// GET /api/assignments/[id]/results - Get exam assignment results with student details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { id } = await params
    // The backend should provide an endpoint that returns the exam assignment results
    const response = await serverFetch<ExamResultsResponse>(`/assignments/${id}/results`, {
      method: "GET",
      token,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching exam results:", error)
    return NextResponse.json({ error: "Error fetching exam results" }, { status: 500 })
  }
}
