import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { Subject } from "@/lib/types";

// GET /api/subjects/[id] - Get subject by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const response = await serverFetch<Subject>(
      API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(id),
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { error: "Error fetching subject" },
      { status: 500 }
    );
  }
}

// PUT /api/subjects/[id] - Update subject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const body = await request.json();
    const response = await serverFetch<Subject>(
      API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(id),
      { method: "PUT", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Error updating subject" },
      { status: 500 }
    );
  }
}

// DELETE /api/subjects/[id] - Delete subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    await serverFetch(
      API_CONFIG.ENDPOINTS.SUBJECT_BY_ID(id),
      { method: "DELETE", token }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Error deleting subject" },
      { status: 500 }
    );
  }
}
