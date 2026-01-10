import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { Exam } from "@/lib/types";

// GET /api/exams - List all exams
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const response = await serverFetch<Exam[]>(API_CONFIG.ENDPOINTS.EXAMS, {
      method: "GET",
      token,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: "Error fetching exams" },
      { status: 500 }
    );
  }
}
