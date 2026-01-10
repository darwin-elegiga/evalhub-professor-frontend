import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { StudentGroup } from "@/lib/types";

// GET /api/groups - List all groups
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const response = await serverFetch<StudentGroup[]>(
      API_CONFIG.ENDPOINTS.GROUPS,
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Error fetching groups" },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const body = await request.json();
    const response = await serverFetch<StudentGroup>(
      API_CONFIG.ENDPOINTS.GROUPS,
      { method: "POST", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Error creating group" },
      { status: 500 }
    );
  }
}
