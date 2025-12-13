import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, level_id, duration_minutes, teacher_id, questions } = body

    if (USE_MOCK_DATA) {
      // Create mock exam
      const newExam = {
        id: crypto.randomUUID(),
        teacher_id,
        level_id,
        title,
        description,
        duration_minutes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Create mock questions with options
      const createdQuestions = questions.map((q: any, index: number) => ({
        id: crypto.randomUUID(),
        exam_id: newExam.id,
        question_text: q.question_text,
        question_latex: q.question_latex || null,
        question_image_url: q.question_image_url || null,
        question_graph_data: q.question_graph_data || null,
        question_order: index + 1,
        points: q.points,
        created_at: new Date().toISOString(),
        answer_options: q.options.map((opt: any, optIndex: number) => ({
          id: crypto.randomUUID(),
          question_id: q.id,
          option_text: opt.option_text,
          option_latex: opt.option_latex || null,
          option_image_url: opt.option_image_url || null,
          is_correct: opt.is_correct,
          option_order: optIndex + 1,
          created_at: new Date().toISOString(),
        })),
      }))

      // Add to mock data (in memory only - won't persist across requests)
      MOCK_DATA.exams.push(newExam as any)

      return NextResponse.json({
        exam: newExam,
        questions: createdQuestions,
      })
    } else {
      // Call real backend
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.EXAMS_CREATE, body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error creating exam:", error)
    return NextResponse.json(
      { error: "Error creating exam" },
      { status: 500 }
    )
  }
}
