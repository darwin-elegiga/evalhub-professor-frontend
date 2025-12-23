import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { QuestionTopic } from "@/lib/types"

// GET /api/topics/[id] - Get topic by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const topic = MOCK_DATA.topics.find((t) => t.id === id)
      if (!topic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }
      return NextResponse.json(topic)
    } else {
      const response = await apiClient.get<QuestionTopic>(API_CONFIG.ENDPOINTS.TOPIC_BY_ID(id))
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching topic:", error)
    return NextResponse.json({ error: "Error fetching topic" }, { status: 500 })
  }
}

// PUT /api/topics/[id] - Update topic
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.topics.findIndex((t) => t.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }

      const updatedTopic: QuestionTopic = {
        ...MOCK_DATA.topics[index],
        ...body,
        id,
      }

      MOCK_DATA.topics[index] = updatedTopic
      return NextResponse.json(updatedTopic)
    } else {
      const response = await apiClient.put<QuestionTopic>(API_CONFIG.ENDPOINTS.TOPIC_BY_ID(id), body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error updating topic:", error)
    return NextResponse.json({ error: "Error updating topic" }, { status: 500 })
  }
}

// DELETE /api/topics/[id] - Delete topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.topics.findIndex((t) => t.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }

      MOCK_DATA.topics.splice(index, 1)
      return NextResponse.json({ success: true })
    } else {
      await apiClient.delete(API_CONFIG.ENDPOINTS.TOPIC_BY_ID(id))
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting topic:", error)
    return NextResponse.json({ error: "Error deleting topic" }, { status: 500 })
  }
}
