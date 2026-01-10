import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";

// POST /api/exams/create - Create new exam
// Expected payload (camelCase):
// {
//   title: string,
//   description: string | null,
//   subjectId: string | null,
//   durationMinutes: number | null,
//   config: { shuffleQuestions, shuffleOptions, showResultsImmediately, allowReview, penaltyPerWrongAnswer, passingPercentage },
//   questions: [{ questionId, weight, questionOrder }]
// }
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    const body = await request.json();
    const response = await serverFetch(API_CONFIG.ENDPOINTS.EXAMS_CREATE, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating exam:", error);
    return NextResponse.json({ error: "Error creating exam" }, { status: 500 });
  }
}
