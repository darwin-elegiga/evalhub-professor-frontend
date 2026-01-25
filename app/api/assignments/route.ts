import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentExamAssignment } from "@/lib/types"

// GET /api/assignments - List all assignments
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { searchParams } = new URL(request.url)

    // Extract query params
    const examId = searchParams.get("examId")
    const studentId = searchParams.get("studentId")
    const status = searchParams.get("status")
    const groupId = searchParams.get("groupId")
    const search = searchParams.get("search")

    // Build endpoint with query params
    const params = new URLSearchParams()
    if (examId) params.append("examId", examId)
    if (studentId) params.append("studentId", studentId)
    if (status) params.append("status", status)
    if (groupId) params.append("groupId", groupId)
    if (search) params.append("search", search)

    let endpoint = API_CONFIG.ENDPOINTS.ASSIGNMENTS
    const queryString = params.toString()
    if (queryString) {
      endpoint += `?${queryString}`
    }

    const response = await serverFetch<StudentExamAssignment[]>(endpoint, {
      method: "GET",
      token,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ error: "Error fetching assignments" }, { status: 500 })
  }
}
