import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentAnswer, QuestionScore } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignment_id, question_id, selected_option_id, answer_text } = body

    if (USE_MOCK_DATA) {
      // Check if answer already exists
      const existingIndex = MOCK_DATA.studentAnswers.findIndex(
        (a) => a.assignment_id === assignment_id && a.question_id === question_id
      )

      const answer: StudentAnswer = {
        id: existingIndex >= 0 ? MOCK_DATA.studentAnswers[existingIndex].id : crypto.randomUUID(),
        assignment_id,
        question_id,
        selected_option_id: selected_option_id || null,
        answer_text: answer_text || null,
        answer_latex: null,
        score: 2 as QuestionScore, // Default score (minimum)
        feedback: null,
        created_at: new Date().toISOString(),
      }

      if (existingIndex >= 0) {
        MOCK_DATA.studentAnswers[existingIndex] = answer
      } else {
        MOCK_DATA.studentAnswers.push(answer)
      }

      return NextResponse.json({ answer })
    } else {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ASSIGNMENTS_ANSWER, body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error saving answer:", error)
    return NextResponse.json(
      { error: "Error saving answer" },
      { status: 500 }
    )
  }
}
