import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { QuestionTopic } from "@/lib/types"

// Helper to transform mock data (snake_case) to API format (camelCase)
const transformTopic = (t: any): QuestionTopic => ({
  id: t.id,
  teacherId: t.teacherId || t.teacher_id,
  subjectId: t.subjectId || t.subject_id,
  name: t.name,
  description: t.description,
  color: t.color,
  createdAt: t.createdAt || t.created_at,
})

// GET /api/topics - List all topics
// Query params: ?subjectId=uuid
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get("subjectId")

    if (USE_MOCK_DATA) {
      let topics = MOCK_DATA.topics.map(transformTopic)

      if (subjectId && subjectId !== "all") {
        topics = topics.filter((t) => t.subjectId === subjectId)
      }

      return NextResponse.json(topics)
    } else {
      const response = await apiClient.get<QuestionTopic[]>(
        `${API_CONFIG.ENDPOINTS.TOPICS}?${searchParams.toString()}`
      )
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching topics:", error)
    return NextResponse.json({ error: "Error fetching topics" }, { status: 500 })
  }
}

// POST /api/topics - Create a new topic
// Payload: { name, description?, color, subjectId }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const newTopic: QuestionTopic = {
        id: `topic${Date.now()}`,
        teacherId: "1",
        subjectId: body.subjectId || MOCK_DATA.subjects[0]?.id || "",
        name: body.name,
        description: body.description || null,
        color: body.color || "blue",
        createdAt: new Date().toISOString(),
      }

      MOCK_DATA.topics.push(newTopic as any)
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
