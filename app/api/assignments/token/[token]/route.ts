import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface ExamTokenResponse {
  assignment: any
  exam: any
  student: any
  questions: any[]
  answers: any[]
}

// GET /api/assignments/token/[token] - Get exam by magic token (for students)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const authToken = request.headers.get("authorization")?.replace("Bearer ", "")
    const { token } = await params
    const response = await serverFetch<ExamTokenResponse>(API_CONFIG.ENDPOINTS.ASSIGNMENT_BY_TOKEN(token), {
      method: "GET",
      token: authToken,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching exam by token:", error)
    return NextResponse.json({ error: "Error fetching exam" }, { status: 500 })
  }
}
