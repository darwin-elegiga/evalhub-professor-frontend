import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentExamAssignment } from "@/lib/types"

// POST /api/exams/assign - Assign exam to students
// Expected payload (camelCase):
// {
//   examId: string,
//   studentIds: string[]
// }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examId, studentIds } = body

    if (USE_MOCK_DATA) {
      // Generate mock assignments with magic links
      const assignments = studentIds.map((studentId: string) => {
        const student = MOCK_DATA.students.find((s) => s.id === studentId)
        const magicToken = crypto.randomUUID().replace(/-/g, "").substring(0, 12)

        const assignment: StudentExamAssignment = {
          id: crypto.randomUUID(),
          examAssignmentId: crypto.randomUUID(),
          examId,
          studentId,
          magicToken,
          assignedAt: new Date().toISOString(),
          startedAt: null,
          submittedAt: null,
          status: "pending",
        }

        // Add to mock data (in memory)
        MOCK_DATA.assignments.push(assignment as any)

        return {
          studentId,
          studentName: student?.fullName || student?.full_name || "Estudiante",
          magicToken,
          magicLink: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/exam/${magicToken}`,
        }
      })

      return NextResponse.json({ assignments })
    } else {
      // Call real backend with camelCase payload
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
