import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import type { QuestionScore } from "@/lib/types"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { score, feedback } = body as { score: QuestionScore; feedback: string | null }

    if (USE_MOCK_DATA) {
      // Find and update the student answer
      const answerIndex = MOCK_DATA.studentAnswers.findIndex((a) => a.id === id)

      if (answerIndex >= 0) {
        MOCK_DATA.studentAnswers[answerIndex] = {
          ...MOCK_DATA.studentAnswers[answerIndex],
          score,
          feedback,
        }
      }

      return NextResponse.json({
        answer: MOCK_DATA.studentAnswers[answerIndex],
      })
    } else {
      const response = await apiClient.put(`/grades/answer/${id}`, body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error updating answer grade:", error)
    return NextResponse.json(
      { error: "Error updating answer grade" },
      { status: 500 }
    )
  }
}
