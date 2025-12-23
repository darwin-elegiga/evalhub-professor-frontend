import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Subject } from "@/lib/types"

// GET /api/subjects/[id] - Get subject by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const subject = MOCK_DATA.subjects?.find((s) => s.id === id)
      if (!subject) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 })
      }
      return NextResponse.json(subject)
    } else {
      const response = await apiClient.get<Subject>(API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(id))
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching subject:", error)
    return NextResponse.json({ error: "Error fetching subject" }, { status: 500 })
  }
}

// PUT /api/subjects/[id] - Update subject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const subjects = MOCK_DATA.subjects || []
      const index = subjects.findIndex((s) => s.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 })
      }

      const updatedSubject: Subject = {
        ...subjects[index],
        ...body,
        id,
      }

      subjects[index] = updatedSubject
      return NextResponse.json(updatedSubject)
    } else {
      const response = await apiClient.put<Subject>(API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(id), body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error updating subject:", error)
    return NextResponse.json({ error: "Error updating subject" }, { status: 500 })
  }
}

// DELETE /api/subjects/[id] - Delete subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const subjects = MOCK_DATA.subjects || []
      const index = subjects.findIndex((s) => s.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 })
      }

      subjects.splice(index, 1)
      return NextResponse.json({ success: true })
    } else {
      await apiClient.delete(API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(id))
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting subject:", error)
    return NextResponse.json({ error: "Error deleting subject" }, { status: 500 })
  }
}
