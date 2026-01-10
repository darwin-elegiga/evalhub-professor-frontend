import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type { Exam } from "@/lib/types";

// GET /api/exams/[id] - Get exam by ID with details
// Response (camelCase):
// {
//   id, teacherId, subjectId, title, description, durationMinutes, createdAt, updatedAt,
//   config: { shuffleQuestions, shuffleOptions, showResultsImmediately, allowReview, penaltyPerWrongAnswer, passingPercentage },
//   questions: [{ id, examId, questionId, questionOrder, weight, bankQuestion }]
// }
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const response = await serverFetch<Exam>(
      API_CONFIG.ENDPOINTS.EXAM_BY_ID(id),
      { method: "GET", token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json({ error: "Error fetching exam" }, { status: 500 });
  }
}

// PUT /api/exams/[id] - Update exam
// Expected payload (camelCase):
// {
//   title, description, subjectId, durationMinutes,
//   config: { shuffleQuestions, shuffleOptions, showResultsImmediately, allowReview, penaltyPerWrongAnswer, passingPercentage },
//   questions: [{ questionId, weight, questionOrder }]
// }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const body = await request.json();
    const response = await serverFetch<Exam>(
      API_CONFIG.ENDPOINTS.EXAM_BY_ID(id),
      { method: "PUT", body: JSON.stringify(body), token }
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json({ error: "Error updating exam" }, { status: 500 });
  }
}

// DELETE /api/exams/[id] - Delete exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    await serverFetch(API_CONFIG.ENDPOINTS.EXAM_BY_ID(id), {
      method: "DELETE",
      token,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json({ error: "Error deleting exam" }, { status: 500 });
  }
}
