import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { StudentGroup } from "@/lib/types";

// GET /api/groups/[id] - Get group by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const response = await serverFetch<StudentGroup>(
      API_CONFIG.ENDPOINTS.GROUP_BY_ID(id),
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { error: "Error fetching group" },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[id] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const body = await request.json();
    const response = await serverFetch<StudentGroup>(
      API_CONFIG.ENDPOINTS.GROUP_BY_ID(id),
      { method: "PUT", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Error updating group" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    await serverFetch(
      API_CONFIG.ENDPOINTS.GROUP_BY_ID(id),
      { method: "DELETE", token }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Error deleting group" },
      { status: 500 }
    );
  }
}
