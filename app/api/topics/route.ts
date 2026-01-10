import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { QuestionTopic } from "@/lib/types"

// GET /api/topics - List all topics
// Query params: ?subjectId=uuid
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { searchParams } = new URL(request.url)
    const response = await serverFetch<QuestionTopic[]>(
      `${API_CONFIG.ENDPOINTS.TOPICS}?${searchParams.toString()}`,
      { method: "GET", token }
    )
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching topics:", error)
    return NextResponse.json({ error: "Error fetching topics" }, { status: 500 })
  }
}

// POST /api/topics - Create a new topic
// Payload: { name, description?, color, subjectId }
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const body = await request.json()
    const response = await serverFetch<QuestionTopic>(API_CONFIG.ENDPOINTS.TOPICS, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    })
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error("Error creating topic:", error)
    return NextResponse.json({ error: "Error creating topic" }, { status: 500 })
  }
}
