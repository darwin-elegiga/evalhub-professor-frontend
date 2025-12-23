import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Student } from "@/lib/types"

// GET /api/students/[id] - Get student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const student = MOCK_DATA.students.find((s) => s.id === id)
      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }
      return NextResponse.json(student)
    } else {
      const response = await apiClient.get<Student>(API_CONFIG.ENDPOINTS.STUDENT_BY_ID(id))
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json({ error: "Error fetching student" }, { status: 500 })
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.students.findIndex((s) => s.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }

      const updatedStudent: Student = {
        ...MOCK_DATA.students[index],
        ...body,
        id, // Ensure ID doesn't change
      }

      MOCK_DATA.students[index] = updatedStudent
      return NextResponse.json(updatedStudent)
    } else {
      const response = await apiClient.put<Student>(API_CONFIG.ENDPOINTS.STUDENT_BY_ID(id), body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Error updating student" }, { status: 500 })
  }
}

// DELETE /api/students/[id] - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.students.findIndex((s) => s.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }

      MOCK_DATA.students.splice(index, 1)
      return NextResponse.json({ success: true })
    } else {
      await apiClient.delete(API_CONFIG.ENDPOINTS.STUDENT_BY_ID(id))
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Error deleting student" }, { status: 500 })
  }
}
