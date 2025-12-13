import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { QuestionTopic } from "@/lib/types"

// GET /api/topics - List all topics
export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_DATA.topics)
    } else {
      const response = await apiClient.get<QuestionTopic[]>(API_CONFIG.ENDPOINTS.TOPICS)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching topics:", error)
    return NextResponse.json({ error: "Error fetching topics" }, { status: 500 })
  }
}

// POST /api/topics - Create a new topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const newTopic: QuestionTopic = {
        id: `topic${Date.now()}`,
        teacher_id: "1",
        name: body.name,
        description: body.description || null,
        color: body.color || "blue",
        created_at: new Date().toISOString(),
      }

      MOCK_DATA.topics.push(newTopic)
      return NextResponse.json(newTopic, { status: 201 })
    } else {
      const response = await apiClient.post<QuestionTopic>(API_CONFIG.ENDPOINTS.TOPICS, body)
      return NextResponse.json(response, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating topic:", error)
    return NextResponse.json({ error: "Error creating topic" }, { status: 500 })
  }
}
