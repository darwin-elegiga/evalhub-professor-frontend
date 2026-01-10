import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { Grade } from "@/lib/types";

// GET /api/grades - List all grades
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const response = await serverFetch<Grade[]>(API_CONFIG.ENDPOINTS.GRADES, {
      method: "GET",
      token,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { error: "Error fetching grades" },
      { status: 500 }
    );
  }
}
