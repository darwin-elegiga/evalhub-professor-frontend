import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { ExamLevel } from "@/lib/types"

// GET /api/levels/[id] - Get level by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const level = MOCK_DATA.levels.find((l) => l.id === id)
      if (!level) {
        return NextResponse.json({ error: "Level not found" }, { status: 404 })
      }
      return NextResponse.json(level)
    } else {
      const response = await apiClient.get<ExamLevel>(API_CONFIG.ENDPOINTS.LEVEL_BY_ID(id))
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching level:", error)
    return NextResponse.json({ error: "Error fetching level" }, { status: 500 })
  }
}

// PUT /api/levels/[id] - Update level
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.levels.findIndex((l) => l.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Level not found" }, { status: 404 })
      }

      const updatedLevel: ExamLevel = {
        ...MOCK_DATA.levels[index],
        ...body,
        id,
      }

      MOCK_DATA.levels[index] = updatedLevel
      return NextResponse.json(updatedLevel)
    } else {
      const response = await apiClient.put<ExamLevel>(API_CONFIG.ENDPOINTS.LEVEL_BY_ID(id), body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error updating level:", error)
    return NextResponse.json({ error: "Error updating level" }, { status: 500 })
  }
}

// DELETE /api/levels/[id] - Delete level
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.levels.findIndex((l) => l.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Level not found" }, { status: 404 })
      }

      MOCK_DATA.levels.splice(index, 1)
      return NextResponse.json({ success: true })
    } else {
      await apiClient.delete(API_CONFIG.ENDPOINTS.LEVEL_BY_ID(id))
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting level:", error)
    return NextResponse.json({ error: "Error deleting level" }, { status: 500 })
  }
}
