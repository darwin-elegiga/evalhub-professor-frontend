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

// GET /api/questions - List all questions
// Query params: subjectId, topicId, type, difficulty
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get("subjectId")
    const topicId = searchParams.get("topicId")
    const type = searchParams.get("type")
    const difficulty = searchParams.get("difficulty")

    if (USE_MOCK_DATA) {
      let questions = MOCK_DATA.bankQuestions.map(transformQuestion)

      // Apply filters
      if (subjectId && subjectId !== "all") {
        questions = questions.filter((q) => q.subjectId === subjectId)
      }
      if (topicId && topicId !== "all") {
        questions = questions.filter((q) => q.topicId === topicId)
      }
      if (type && type !== "all") {
        questions = questions.filter((q) => q.questionType === type)
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
// Payload: { subjectId?, topicId?, title, content, questionType, typeConfig, difficulty?, estimatedTimeMinutes?, tags?, weight? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const newQuestion: BankQuestion = {
        id: `bq${Date.now()}`,
        teacherId: "1",
        subjectId: body.subjectId || null,
        topicId: body.topicId || null,
        title: body.title,
        content: body.content,
        questionType: body.questionType,
        typeConfig: body.typeConfig,
        difficulty: body.difficulty || "medium",
        estimatedTimeMinutes: body.estimatedTimeMinutes || null,
        tags: body.tags || [],
        weight: body.weight || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timesUsed: 0,
        averageScore: null,
      }

      MOCK_DATA.bankQuestions.push(newQuestion as any)
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
