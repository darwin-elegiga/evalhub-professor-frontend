import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentExamAssignment } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exam_id, student_ids, exam_assignment_id } = body

    if (USE_MOCK_DATA) {
      // Generate mock assignments with magic links
      const assignments = student_ids.map((studentId: string) => {
        const student = MOCK_DATA.students.find((s) => s.id === studentId)
        const magicToken = crypto.randomUUID().replace(/-/g, "").substring(0, 12)

        const assignment: StudentExamAssignment = {
          id: crypto.randomUUID(),
          exam_assignment_id: exam_assignment_id || crypto.randomUUID(),
          exam_id,
          student_id: studentId,
          magic_token: magicToken,
          assigned_at: new Date().toISOString(),
          started_at: null,
          submitted_at: null,
          status: "pending",
        }

        // Add to mock data (in memory)
        MOCK_DATA.assignments.push(assignment)

        return {
          student_id: studentId,
          student_name: student?.full_name || "Estudiante",
          magic_token: magicToken,
          url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/exam/${magicToken}`,
        }
      })

      return NextResponse.json({ assignments })
    } else {
      // Call real backend
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.EXAMS_ASSIGN, body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error assigning exam:", error)
    return NextResponse.json(
      { error: "Error assigning exam" },
      { status: 500 }
    )
  }
}
