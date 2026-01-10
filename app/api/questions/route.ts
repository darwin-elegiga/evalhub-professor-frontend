import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { BankQuestion } from "@/lib/types";

// GET /api/questions - List all questions
// Query params: subjectId, topicId, type, difficulty
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { searchParams } = new URL(request.url);
    const response = await serverFetch<BankQuestion[]>(
      `${API_CONFIG.ENDPOINTS.QUESTIONS}?${searchParams.toString()}`,
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Error fetching questions" },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create a new question
// Payload: { subjectId?, topicId?, title, content, questionType, typeConfig, difficulty?, estimatedTimeMinutes?, tags?, weight? }
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const body = await request.json();
    const response = await serverFetch<BankQuestion>(
      API_CONFIG.ENDPOINTS.QUESTIONS,
      { method: "POST", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Error creating question" },
      { status: 500 }
    );
  }
}
