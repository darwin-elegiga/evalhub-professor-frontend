import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Subject } from "@/lib/types"

// GET /api/subjects - List all subjects
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const response = await serverFetch<Subject[]>(API_CONFIG.ENDPOINTS.SUBJECTS, {
      method: "GET",
      token,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json({ error: "Error fetching subjects" }, { status: 500 })
  }
}

// POST /api/subjects - Create a new subject
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const body = await request.json()
    const response = await serverFetch<Subject>(API_CONFIG.ENDPOINTS.SUBJECTS, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    })
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json({ error: "Error creating subject" }, { status: 500 })
  }
}
