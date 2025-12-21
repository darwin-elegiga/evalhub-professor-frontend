import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { BankQuestion } from "@/lib/types"

// GET /api/questions - List all questions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get("topic_id")
    const type = searchParams.get("type")
    const difficulty = searchParams.get("difficulty")

    if (USE_MOCK_DATA) {
      let questions = [...MOCK_DATA.bankQuestions]

      // Apply filters
      if (topicId && topicId !== "all") {
        questions = questions.filter((q) => q.topic_id === topicId)
      }
      if (type && type !== "all") {
        questions = questions.filter((q) => q.question_type === type)
      }
      if (difficulty && difficulty !== "all") {
        questions = questions.filter((q) => q.difficulty === difficulty)
      }

      return NextResponse.json(questions)
    } else {
      const response = await apiClient.get<BankQuestion[]>(
        `${API_CONFIG.ENDPOINTS.QUESTIONS}?${searchParams.toString()}`
      )
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Error fetching questions" }, { status: 500 })
  }
}

// POST /api/questions - Create a new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const newQuestion: BankQuestion = {
        id: `bq${Date.now()}`,
        teacher_id: "1",
        subject_id: body.subject_id || null,
        topic_id: body.topic_id || null,
        title: body.title,
        content: body.content,
        question_type: body.question_type,
        type_config: body.type_config,
        difficulty: body.difficulty,
        estimated_time_minutes: body.estimated_time_minutes || null,
        tags: body.tags || [],
        weight: body.weight || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        times_used: 0,
        average_score: undefined,
      }

      MOCK_DATA.bankQuestions.push(newQuestion)
      return NextResponse.json(newQuestion, { status: 201 })
    } else {
      const response = await apiClient.post<BankQuestion>(API_CONFIG.ENDPOINTS.QUESTIONS, body)
      return NextResponse.json(response, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Error creating question" }, { status: 500 })
  }
}
