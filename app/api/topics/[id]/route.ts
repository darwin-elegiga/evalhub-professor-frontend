import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { QuestionTopic } from "@/lib/types";

// GET /api/topics/[id] - Get topic by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const response = await serverFetch<QuestionTopic>(
      API_CONFIG.ENDPOINTS.TOPIC_BY_ID(id),
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Error fetching topic" },
      { status: 500 }
    );
  }
}

// PUT /api/topics/[id] - Update topic
// Payload: { name?, description?, color?, subjectId? }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const body = await request.json();
    const response = await serverFetch<QuestionTopic>(
      API_CONFIG.ENDPOINTS.TOPIC_BY_ID(id),
      { method: "PUT", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      { error: "Error updating topic" },
      { status: 500 }
    );
  }
}

// DELETE /api/topics/[id] - Delete topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    await serverFetch(
      API_CONFIG.ENDPOINTS.TOPIC_BY_ID(id),
      { method: "DELETE", token }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      { error: "Error deleting topic" },
      { status: 500 }
    );
  }
}
