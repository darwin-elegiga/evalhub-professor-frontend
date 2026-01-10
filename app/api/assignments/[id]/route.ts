import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentExamAssignment } from "@/lib/types"

// GET /api/assignments/[id] - Get assignment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { id } = await params
    const response = await serverFetch<StudentExamAssignment>(API_CONFIG.ENDPOINTS.ASSIGNMENT_BY_ID(id), {
      method: "GET",
      token,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching assignment:", error)
    return NextResponse.json({ error: "Error fetching assignment" }, { status: 500 })
  }
}
