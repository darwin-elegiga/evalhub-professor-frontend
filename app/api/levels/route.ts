import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { ExamLevel } from "@/lib/types";

// GET /api/levels - List all levels
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const response = await serverFetch<ExamLevel[]>(
      API_CONFIG.ENDPOINTS.LEVELS,
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { error: "Error fetching levels" },
      { status: 500 }
    );
  }
}

// POST /api/levels - Create a new level
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const body = await request.json();
    const response = await serverFetch<ExamLevel>(
      API_CONFIG.ENDPOINTS.LEVELS,
      { method: "POST", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating level:", error);
    return NextResponse.json(
      { error: "Error creating level" },
      { status: 500 }
    );
  }
}
