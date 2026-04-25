import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = cookies().get("userId")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const response = NextResponse.json({ error: "User not found" }, { status: 401 });
      response.cookies.delete("userId");
      return response;
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "ACTIVE";
    const topicId = searchParams.get("topicId");

    const where: Record<string, unknown> = { userId };

    if (status !== "ALL") {
      where.status = status;
    }

    if (topicId) {
      where.question = { topicId };
    }

    const wrongNotes = await prisma.wrongNote.findMany({
      where,
      include: {
        question: {
          include: {
            topic: { select: { id: true, name_ko: true, name_en: true } },
            answerOptions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const notes = wrongNotes.map((note) => ({
      id: note.id,
      questionId: note.questionId,
      status: note.status,
      wrongCount: note.wrongCount,
      consecutiveCorrect: note.consecutiveCorrect,
      createdAt: note.createdAt,
      resolvedAt: note.resolvedAt,
      question: {
        id: note.question.id,
        topicId: note.question.topicId,
        question_ko: note.question.text_ko,
        question_en: note.question.text_en,
        hint_ko: note.question.hint_ko,
        hint_en: note.question.hint_en,
        difficulty: note.question.difficulty,
        topic: note.question.topic,
        answerOptions: note.question.answerOptions,
      },
    }));

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Failed to get wrong notes:", error);
    return NextResponse.json({ error: "Failed to get wrong notes" }, { status: 500 });
  }
}
