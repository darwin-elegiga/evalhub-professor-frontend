import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Grade, FinalGrade, GradeRoundingMethod } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignment_id, average_score, final_grade, rounding_method, graded_by } = body as {
      assignment_id: string
      average_score: number
      final_grade: FinalGrade
      rounding_method: GradeRoundingMethod
      graded_by: string
    }

    if (USE_MOCK_DATA) {
      // Check if grade already exists
      const existingIndex = MOCK_DATA.grades.findIndex(
        (g) => g.assignment_id === assignment_id
      )

      const grade: Grade = {
        id: existingIndex >= 0 ? MOCK_DATA.grades[existingIndex].id : crypto.randomUUID(),
        assignment_id,
        average_score,
        final_grade,
        rounding_method,
        graded_at: new Date().toISOString(),
        graded_by,
      }

      if (existingIndex >= 0) {
        MOCK_DATA.grades[existingIndex] = grade
      } else {
        MOCK_DATA.grades.push(grade)
      }

      // Update assignment status
      const assignmentIndex = MOCK_DATA.assignments.findIndex(
        (a) => a.id === assignment_id
      )
      if (assignmentIndex >= 0) {
        MOCK_DATA.assignments[assignmentIndex].status = "graded"
      }

      return NextResponse.json({ grade })
    } else {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.GRADES_SUBMIT, body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error submitting grade:", error)
    return NextResponse.json(
      { error: "Error submitting grade" },
      { status: 500 }
    )
  }
}
