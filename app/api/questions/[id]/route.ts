import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { BankQuestion } from "@/lib/types";

// GET /api/questions/[id] - Get a single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const response = await serverFetch<BankQuestion>(
      `${API_CONFIG.ENDPOINTS.QUESTIONS}/${id}`,
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Error fetching question" },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[id] - Update a question
// Payload (all optional): { subjectId, topicId, title, content, questionType, typeConfig, difficulty, estimatedTimeMinutes, tags, weight }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const body = await request.json();
    const response = await serverFetch<BankQuestion>(
      `${API_CONFIG.ENDPOINTS.QUESTIONS}/${id}`,
      { method: "PUT", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Error updating question" },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Delete a question
// Response: 204 No Content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    await serverFetch(`${API_CONFIG.ENDPOINTS.QUESTIONS}/${id}`, {
      method: "DELETE",
      token,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Error deleting question" },
      { status: 500 }
    );
  }
}
