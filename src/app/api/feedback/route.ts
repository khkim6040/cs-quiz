import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { content, questionId, category, userId } = await request.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "피드백 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    await prisma.feedback.create({
      data: {
        content: content.trim(),
        questionId: questionId || null,
        category: category || null,
        userId: userId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save feedback:", error);
    return NextResponse.json(
      { error: "피드백 저장에 실패했습니다" },
      { status: 500 }
    );
  }
}
