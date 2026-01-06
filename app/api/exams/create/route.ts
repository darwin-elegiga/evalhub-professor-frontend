import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

// POST /api/exams/create - Create new exam
// Expected payload (camelCase):
// {
//   title: string,
//   description: string | null,
//   subjectId: string | null,
//   durationMinutes: number | null,
//   config: { shuffleQuestions, shuffleOptions, showResultsImmediately, allowReview, penaltyPerWrongAnswer, passingPercentage },
//   questions: [{ questionId, weight, questionOrder }]
// }
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    const body = await request.json()
    const { title, description, subjectId, durationMinutes, config, questions } = body

    if (USE_MOCK_DATA) {
      // Create mock exam
      const newExam = {
        id: crypto.randomUUID(),
        teacherId: "mock-teacher-id",
        subjectId: subjectId || null,
        title,
        description: description || null,
        durationMinutes: durationMinutes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: config || {
          shuffleQuestions: false,
          shuffleOptions: true,
          showResultsImmediately: true,
          allowReview: true,
          penaltyPerWrongAnswer: null,
          passingPercentage: 60,
        },
      }

      // Create mock exam questions
      const createdQuestions = (questions || []).map((q: any, index: number) => {
        const bankQuestion = MOCK_DATA.bankQuestions.find((bq) => bq.id === q.questionId)
        return {
          id: crypto.randomUUID(),
          examId: newExam.id,
          questionId: q.questionId,
          questionOrder: q.questionOrder || index + 1,
          weight: q.weight || 1,
          bankQuestion: bankQuestion || null,
        }
      })

      // Add to mock data (in memory only - won't persist across requests)
      MOCK_DATA.exams.push(newExam as any)

      return NextResponse.json({
        exam: newExam,
        questions: createdQuestions,
      })
    } else {
      // Call real backend with camelCase payload
      const response = await serverFetch(API_CONFIG.ENDPOINTS.EXAMS_CREATE, {
        method: "POST",
        body: JSON.stringify(body),
        token,
      })
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
