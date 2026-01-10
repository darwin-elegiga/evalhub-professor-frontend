import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api-client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;
    const body = await request.json();
    const response = await serverFetch(`/grades/answer/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      token,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating answer grade:", error);
    return NextResponse.json(
      { error: "Error updating answer grade" },
      { status: 500 }
    );
  }
}
