import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface GradingDataResponse {
  assignment: any
  student: any
  exam: any
  questions: any[]
  answers: any[]
  events: any[]
  existingGrade: any | null
}

// GET /api/assignments/[id]/grading - Get full grading data for an assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      // Find the assignment
      const assignment = MOCK_DATA.assignments?.find((a: any) => a.id === id)
      if (!assignment) {
        return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
      }

      // Find the student
      const student = MOCK_DATA.students.find((s) => s.id === assignment.student_id)

      // Find the exam
      const exam = MOCK_DATA.exams.find((e) => e.id === assignment.exam_id)

      // Get bank questions (in real implementation, this would be exam-specific questions)
      const questions = MOCK_DATA.bankQuestions || []

      // Get answers for this assignment
      const answers = MOCK_DATA.studentAnswers?.filter((a) => a.assignment_id === id) || []

      // Get events for this assignment
      const events = MOCK_DATA.examEvents?.filter((e) => e.assignment_id === id) || []

      // Get existing grade
      const existingGrade = MOCK_DATA.grades?.find((g) => g.assignment_id === id) || null

      return NextResponse.json({
        assignment,
        student,
        exam,
        questions,
        answers,
        events,
        existingGrade,
      })
    } else {
      const response = await apiClient.get<GradingDataResponse>(API_CONFIG.ENDPOINTS.ASSIGNMENT_GRADING(id))
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching grading data:", error)
    return NextResponse.json({ error: "Error fetching grading data" }, { status: 500 })
  }
}
