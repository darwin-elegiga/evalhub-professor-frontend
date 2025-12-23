import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface ExamTokenResponse {
  assignment: any
  exam: any
  student: any
  questions: any[]
  answers: any[]
}

// GET /api/assignments/token/[token] - Get exam by magic token (for students)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (USE_MOCK_DATA) {
      // Find the assignment by magic token
      const assignment = MOCK_DATA.assignments?.find((a: any) => a.magic_token === token)
      if (!assignment) {
        return NextResponse.json({ error: "Invalid token" }, { status: 404 })
      }

      // Find the student
      const student = MOCK_DATA.students.find((s) => s.id === assignment.student_id)

      // Find the exam
      const exam = MOCK_DATA.exams.find((e) => e.id === assignment.exam_id)
      if (!exam) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 })
      }

      // Get bank questions and sanitize them for students
      const questions = MOCK_DATA.bankQuestions.map((bankQuestion, index) => {
        if (!bankQuestion) return null

        // Remove correct answer information for multiple choice
        const sanitizedQuestion = { ...bankQuestion }
        if (sanitizedQuestion.question_type === "multiple_choice" && sanitizedQuestion.type_config) {
          const config = sanitizedQuestion.type_config as any
          if (config.options) {
            config.options = config.options.map((opt: any) => ({
              id: opt.id,
              text: opt.text,
              order: opt.order,
              // is_correct is removed
            }))
          }
        }

        return {
          ...sanitizedQuestion,
          weight: bankQuestion.weight || 1,
          question_order: index + 1,
        }
      }).filter(Boolean)

      // Get existing answers for this assignment
      const answers = MOCK_DATA.studentAnswers?.filter((a) => a.assignment_id === assignment.id) || []

      return NextResponse.json({
        assignment: {
          id: assignment.id,
          status: assignment.status,
          started_at: assignment.started_at,
          submitted_at: assignment.submitted_at,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration_minutes: exam.duration_minutes,
        },
        student: student ? {
          id: student.id,
          full_name: student.full_name,
        } : null,
        questions,
        answers,
      })
    } else {
      const response = await apiClient.get<ExamTokenResponse>(API_CONFIG.ENDPOINTS.ASSIGNMENT_BY_TOKEN(token))
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching exam by token:", error)
    return NextResponse.json({ error: "Error fetching exam" }, { status: 500 })
  }
}
