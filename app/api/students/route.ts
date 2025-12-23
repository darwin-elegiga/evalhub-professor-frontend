import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Student } from "@/lib/types"

// GET /api/students - List all students
export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_DATA.students)
    } else {
      const response = await apiClient.get<Student[]>(API_CONFIG.ENDPOINTS.STUDENTS)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Error fetching students" }, { status: 500 })
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const newStudent: Student = {
        id: crypto.randomUUID(),
        teacher_id: body.teacher_id || "1",
        group_id: body.group_id || null,
        full_name: body.full_name,
        email: body.email,
        year: body.year || null,
        career: body.career || null,
        created_at: new Date().toISOString(),
      }

      MOCK_DATA.students.push(newStudent)
      return NextResponse.json(newStudent, { status: 201 })
    } else {
      const response = await apiClient.post<Student>(API_CONFIG.ENDPOINTS.STUDENTS, body)
      return NextResponse.json(response, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "Error creating student" }, { status: 500 })
  }
}
