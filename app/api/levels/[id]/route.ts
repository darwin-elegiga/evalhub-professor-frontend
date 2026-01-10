import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { ExamLevel } from "@/lib/types";

// GET /api/levels/[id] - Get level by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const response = await serverFetch<ExamLevel>(
      API_CONFIG.ENDPOINTS.LEVEL_BY_ID(id),
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching level:", error);
    return NextResponse.json(
      { error: "Error fetching level" },
      { status: 500 }
    );
  }
}

// PUT /api/levels/[id] - Update level
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const body = await request.json();
    const response = await serverFetch<ExamLevel>(
      API_CONFIG.ENDPOINTS.LEVEL_BY_ID(id),
      { method: "PUT", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating level:", error);
    return NextResponse.json(
      { error: "Error updating level" },
      { status: 500 }
    );
  }
}

// DELETE /api/levels/[id] - Delete level
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    await serverFetch(
      API_CONFIG.ENDPOINTS.LEVEL_BY_ID(id),
      { method: "DELETE", token }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting level:", error);
    return NextResponse.json(
      { error: "Error deleting level" },
      { status: 500 }
    );
  }
}
