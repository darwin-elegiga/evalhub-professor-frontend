import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { Student } from "@/lib/types";

// GET /api/students - List all students
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const response = await serverFetch<Student[]>(
      API_CONFIG.ENDPOINTS.STUDENTS,
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Error fetching students" },
      { status: 500 }
    );
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const body = await request.json();
    const response = await serverFetch<Student>(
      API_CONFIG.ENDPOINTS.STUDENTS,
      { method: "POST", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Error creating student" },
      { status: 500 }
    );
  }
}
