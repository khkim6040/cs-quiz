import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const userId = cookies().get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please login first" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please login again." },
        { status: 401 }
      );
    }

    const { quizType, topicId, dailySetId, solvedCount, correctCount, timeSpent } =
      await request.json();

    if (!quizType || solvedCount == null || correctCount == null || timeSpent == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await prisma.quizSession.create({
      data: {
        userId,
        quizType,
        topicId: topicId || null,
        dailySetId: dailySetId || null,
        solvedCount,
        correctCount,
        timeSpent,
      },
    });

    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error("Failed to save quiz session:", error);
    return NextResponse.json(
      { error: "Failed to save quiz session" },
      { status: 500 }
    );
  }
}
