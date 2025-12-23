import { NextRequest, NextResponse } from "next/server"
import { MOCK_DATA, USE_MOCK_DATA } from "@/lib/mock-data"
import { apiClient } from "@/lib/api-client"
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
    const body: ExamEventRequest = await request.json()

    if (USE_MOCK_DATA) {
      const newEvent: ExamEvent = {
        id: crypto.randomUUID(),
        assignment_id: body.assignment_id,
        event_type: body.event_type,
        severity: body.severity,
        timestamp: body.timestamp,
        details: body.details,
      }

      // Initialize examEvents array if it doesn't exist
      if (!MOCK_DATA.examEvents) {
        (MOCK_DATA as any).examEvents = []
      }

      MOCK_DATA.examEvents.push(newEvent)

      return NextResponse.json({ success: true, event: newEvent }, { status: 201 })
    } else {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.EXAM_EVENTS, body)
      return NextResponse.json(response, { status: 201 })
    }
  } catch (error) {
    console.error("Error registering exam event:", error)
    return NextResponse.json({ error: "Error registering event" }, { status: 500 })
  }
}

// GET /api/exam/event?assignment_id=xxx - Get events for an assignment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get("assignment_id")

    if (!assignmentId) {
      return NextResponse.json({ error: "assignment_id is required" }, { status: 400 })
    }

    if (USE_MOCK_DATA) {
      const events = MOCK_DATA.examEvents?.filter((e) => e.assignment_id === assignmentId) || []
      return NextResponse.json(events)
    } else {
      const response = await apiClient.get<ExamEvent[]>(`${API_CONFIG.ENDPOINTS.EXAM_EVENTS}?assignment_id=${assignmentId}`)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Error fetching exam events:", error)
    return NextResponse.json({ error: "Error fetching events" }, { status: 500 })
  }
}
