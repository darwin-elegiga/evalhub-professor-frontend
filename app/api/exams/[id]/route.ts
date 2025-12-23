import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Exam } from "@/lib/types"

// GET /api/exams/[id] - Get exam by ID with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const exam = MOCK_DATA.exams.find((e) => e.id === id)
      if (!exam) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 })
      }

      // Get bank questions for this exam (in real implementation, these would be exam-specific)
      const questionsWithDetails = MOCK_DATA.bankQuestions.map((bq, index) => ({
        id: `eq-${bq.id}`,
        exam_id: id,
        bank_question_id: bq.id,
        question_order: index + 1,
        weight: bq.weight || 1,
        bank_question: bq,
      }))

      return NextResponse.json({
        ...exam,
        questions: questionsWithDetails,
      })
    } else {
      const response = await apiClient.get<Exam>(API_CONFIG.ENDPOINTS.EXAM_BY_ID(id))
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching exam:", error)
    return NextResponse.json({ error: "Error fetching exam" }, { status: 500 })
  }
}

// PUT /api/exams/[id] - Update exam
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.exams.findIndex((e) => e.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 })
      }

      const updatedExam = {
        ...MOCK_DATA.exams[index],
        ...body,
        id,
        updated_at: new Date().toISOString(),
      }

      MOCK_DATA.exams[index] = updatedExam as Exam
      return NextResponse.json(updatedExam)
    } else {
      const response = await apiClient.put<Exam>(API_CONFIG.ENDPOINTS.EXAM_BY_ID(id), body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error updating exam:", error)
    return NextResponse.json({ error: "Error updating exam" }, { status: 500 })
  }
}

// DELETE /api/exams/[id] - Delete exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.exams.findIndex((e) => e.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 })
      }

      MOCK_DATA.exams.splice(index, 1)
      return NextResponse.json({ success: true })
    } else {
      await apiClient.delete(API_CONFIG.ENDPOINTS.EXAM_BY_ID(id))
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting exam:", error)
    return NextResponse.json({ error: "Error deleting exam" }, { status: 500 })
  }
}
