import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { StudentGroup } from "@/lib/types"

// GET /api/groups/[id] - Get group by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const group = MOCK_DATA.studentGroups.find((g: StudentGroup) => g.id === id)
      if (!group) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 })
      }
      return NextResponse.json(group)
    } else {
      const response = await apiClient.get<StudentGroup>(API_CONFIG.ENDPOINTS.GROUP_BY_ID(id))
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching group:", error)
    return NextResponse.json({ error: "Error fetching group" }, { status: 500 })
  }
}

// PUT /api/groups/[id] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.studentGroups.findIndex((g: StudentGroup) => g.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 })
      }

      const updatedGroup: StudentGroup = {
        ...MOCK_DATA.studentGroups[index],
        ...body,
        id,
      }

      MOCK_DATA.studentGroups[index] = updatedGroup
      return NextResponse.json(updatedGroup)
    } else {
      const response = await apiClient.put<StudentGroup>(API_CONFIG.ENDPOINTS.GROUP_BY_ID(id), body)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error updating group:", error)
    return NextResponse.json({ error: "Error updating group" }, { status: 500 })
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      const index = MOCK_DATA.studentGroups.findIndex((g: StudentGroup) => g.id === id)
      if (index === -1) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 })
      }

      MOCK_DATA.studentGroups.splice(index, 1)
      return NextResponse.json({ success: true })
    } else {
      await apiClient.delete(API_CONFIG.ENDPOINTS.GROUP_BY_ID(id))
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting group:", error)
    return NextResponse.json({ error: "Error deleting group" }, { status: 500 })
  }
}
