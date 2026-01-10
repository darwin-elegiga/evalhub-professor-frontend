import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { ExamEvent, ExamEventType, ExamEventSeverity } from "@/lib/types"

interface ExamEventRequest {
  assignment_id: string
  event_type: ExamEventType
  severity: ExamEventSeverity
  timestamp: string
  details: {
    duration_seconds?: number
    pasted_length?: number
    shortcut_keys?: string
    idle_duration_seconds?: number
    question_index?: number
    answer_time_seconds?: number
    window_dimensions?: { width: number; height: number }
    message?: string
  }
}

// POST /api/exam/event - Register an exam monitoring event
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const body: ExamEventRequest = await request.json()
    const response = await serverFetch(API_CONFIG.ENDPOINTS.EXAM_EVENTS, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    })
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error("Error registering exam event:", error)
    return NextResponse.json({ error: "Error registering event" }, { status: 500 })
  }
}

// GET /api/exam/event?assignment_id=xxx - Get events for an assignment
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get("assignment_id")

    if (!assignmentId) {
      return NextResponse.json({ error: "assignment_id is required" }, { status: 400 })
    }
    const response = await serverFetch<ExamEvent[]>(`${API_CONFIG.ENDPOINTS.EXAM_EVENTS}?assignment_id=${assignmentId}`, {
      method: "GET",
      token,
    })
    return NextResponse.json(response)

  } catch (error) {
    console.error("Error fetching exam events:", error)
    return NextResponse.json({ error: "Error fetching events" }, { status: 500 })
  }
}
