import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { BankQuestion } from "@/lib/types"

// Helper to transform mock data (snake_case) to API format (camelCase)
const transformQuestion = (q: any): BankQuestion => ({
  id: q.id,
  teacherId: q.teacherId || q.teacher_id,
  subjectId: q.subjectId || q.subject_id || null,
  topicId: q.topicId || q.topic_id || null,
  title: q.title,
  content: q.content,
  questionType: q.questionType || q.question_type,
  typeConfig: q.typeConfig || q.type_config,
  difficulty: q.difficulty,
  estimatedTimeMinutes: q.estimatedTimeMinutes || q.estimated_time_minutes || null,
  tags: q.tags || [],
  weight: q.weight || 1,
  createdAt: q.createdAt || q.created_at,
  updatedAt: q.updatedAt || q.updated_at,
  timesUsed: q.timesUsed || q.times_used || 0,
  averageScore: q.averageScore || q.average_score || null,
})

// GET /api/questions/[id] - Get a single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const question = MOCK_DATA.bankQuestions.find((q) => q.id === id)
      if (!question) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 })
      }
      return NextResponse.json(transformQuestion(question))
    } else {
      const response = await apiClient.get<BankQuestion>(`${API_CONFIG.ENDPOINTS.QUESTIONS}/${id}`)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching question:", error)
    return NextResponse.json({ error: "Error fetching question" }, { status: 500 })
  }
}

// PUT /api/questions/[id] - Update a question
// Payload (all optional): { subjectId, topicId, title, content, questionType, typeConfig, difficulty, estimatedTimeMinutes, tags, weight }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.bankQuestions.findIndex((q) => q.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 })
      }

      const existing = MOCK_DATA.bankQuestions[index]
      const updatedQuestion = {
        ...existing,
        ...body,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      }

      MOCK_DATA.bankQuestions[index] = updatedQuestion as any
      return NextResponse.json(transformQuestion(updatedQuestion))
    } else {
      const response = await apiClient.put<BankQuestion>(
        `${API_CONFIG.ENDPOINTS.QUESTIONS}/${id}`,
        body
      )
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Error updating question" }, { status: 500 })
  }
}

// DELETE /api/questions/[id] - Delete a question
// Response: 204 No Content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.bankQuestions.findIndex((q) => q.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 })
      }

      MOCK_DATA.bankQuestions.splice(index, 1)
      return new NextResponse(null, { status: 204 })
    } else {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.QUESTIONS}/${id}`)
      return new NextResponse(null, { status: 204 })
    }
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Error deleting question" }, { status: 500 })
  }
}
