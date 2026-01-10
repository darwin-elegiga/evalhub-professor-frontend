import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { Student } from "@/lib/types";

// GET /api/students/[id] - Get student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const response = await serverFetch<Student>(
      API_CONFIG.ENDPOINTS.STUDENT_BY_ID(id),
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Error fetching student" },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const body = await request.json();
    const response = await serverFetch<Student>(
      API_CONFIG.ENDPOINTS.STUDENT_BY_ID(id),
      { method: "PUT", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Error updating student" },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    await serverFetch(
      API_CONFIG.ENDPOINTS.STUDENT_BY_ID(id),
      { method: "DELETE", token }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Error deleting student" },
      { status: 500 }
    );
  }
}
