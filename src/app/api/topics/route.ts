import { NextResponse } from "next/server";
import { topicsData } from "@/lib/quizData";

export async function GET() {
  try {
    return NextResponse.json(topicsData);
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
