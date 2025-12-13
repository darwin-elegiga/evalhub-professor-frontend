import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { BankQuestion } from "@/lib/types"

// GET /api/questions/[id] - Get a single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const question = MOCK_DATA.bankQuestions.find((q) => q.id === id)
      if (!question) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 })
      }
      return NextResponse.json(question)
    } else {
      const response = await apiClient.get<BankQuestion>(`${API_CONFIG.ENDPOINTS.QUESTIONS}/${id}`)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching question:", error)
    return NextResponse.json({ error: "Error fetching question" }, { status: 500 })
  }
}

// PUT /api/questions/[id] - Update a question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.bankQuestions.findIndex((q) => q.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 })
      }

      const updatedQuestion: BankQuestion = {
        ...MOCK_DATA.bankQuestions[index],
        ...body,
        id, // Ensure ID doesn't change
        updated_at: new Date().toISOString(),
      }

      MOCK_DATA.bankQuestions[index] = updatedQuestion
      return NextResponse.json(updatedQuestion)
    } else {
      const response = await apiClient.put<BankQuestion>(
        `${API_CONFIG.ENDPOINTS.QUESTIONS}/${id}`,
        body
      )
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Error updating question" }, { status: 500 })
  }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.bankQuestions.findIndex((q) => q.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 })
      }

      MOCK_DATA.bankQuestions.splice(index, 1)
      return NextResponse.json({ success: true })
    } else {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.QUESTIONS}/${id}`)
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Error deleting question" }, { status: 500 })
  }
}
