import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { onCorrect, onWrong, getNextReviewDate, MAX_BOX } from "@/lib/leitner";

export async function POST(request: Request) {
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

    const { results } = await request.json();

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Missing results array" }, { status: 400 });
    }

    let graduated = 0;
    let reset = 0;
    const now = new Date();

    await Promise.all(
      results.map(async ({ questionId, correct }: { questionId: string; correct: boolean }) => {
        const note = await prisma.wrongNote.findUnique({
          where: { userId_questionId: { userId, questionId } },
        });

        if (!note) return;

        if (correct) {
          const { newBox, graduated: isGraduated } = onCorrect(note.leitnerBox);

          if (isGraduated) {
            await prisma.wrongNote.update({
              where: { id: note.id },
              data: {
                leitnerBox: MAX_BOX,
                consecutiveCorrect: note.consecutiveCorrect + 1,
                status: "RESOLVED",
                resolvedAt: now,
                lastReviewedAt: now,
                nextReviewAt: null,
              },
            });
            graduated++;
          } else {
            await prisma.wrongNote.update({
              where: { id: note.id },
              data: {
                leitnerBox: newBox,
                consecutiveCorrect: note.consecutiveCorrect + 1,
                lastReviewedAt: now,
                nextReviewAt: getNextReviewDate(newBox, now),
              },
            });
          }
        } else {
          const { newBox } = onWrong();
          await prisma.wrongNote.update({
            where: { id: note.id },
            data: {
              leitnerBox: newBox,
              consecutiveCorrect: 0,
              wrongCount: { increment: 1 },
              lastReviewedAt: now,
              nextReviewAt: getNextReviewDate(newBox, now),
            },
          });
          reset++;
        }
      })
    );

    return NextResponse.json({ graduated, reset });
  } catch (error) {
    console.error("Failed to process review result:", error);
    return NextResponse.json({ error: "Failed to process review result" }, { status: 500 });
  }
}
