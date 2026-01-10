import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";

// POST /api/exams/assign - Assign exam to students
// Expected payload (camelCase):
// {
//   examId: string,
//   studentIds: string[]
// }
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const body = await request.json();
    const response = await serverFetch(
      API_CONFIG.ENDPOINTS.EXAMS_ASSIGN,
      { method: "POST", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error assigning exam:", error);
    return NextResponse.json(
      { error: "Error assigning exam" },
      { status: 500 }
    );
  }
}
