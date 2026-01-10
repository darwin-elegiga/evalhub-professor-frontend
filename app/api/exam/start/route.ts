import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const body = await request.json()
    const response = await serverFetch(API_CONFIG.ENDPOINTS.ASSIGNMENTS_START, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error starting exam:", error)
    return NextResponse.json(
      { error: "Error starting exam" },
      { status: 500 }
    )
  }
}
