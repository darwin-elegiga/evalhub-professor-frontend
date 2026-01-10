import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentExamAssignment } from "@/lib/types"

// GET /api/assignments - List all assignments
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Build endpoint with query params
    let endpoint = API_CONFIG.ENDPOINTS.ASSIGNMENTS
    if (status) {
      endpoint += `?status=${status}`
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
