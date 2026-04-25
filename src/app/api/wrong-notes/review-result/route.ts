import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const GRADUATE_THRESHOLD = 3;

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

    await Promise.all(
      results.map(async ({ questionId, correct }: { questionId: string; correct: boolean }) => {
        const note = await prisma.wrongNote.findUnique({
          where: { userId_questionId: { userId, questionId } },
        });

        if (!note) return;

        if (correct) {
          const newConsecutive = note.consecutiveCorrect + 1;
          if (newConsecutive >= GRADUATE_THRESHOLD) {
            await prisma.wrongNote.update({
              where: { id: note.id },
              data: {
                consecutiveCorrect: newConsecutive,
                status: "RESOLVED",
                resolvedAt: new Date(),
              },
            });
            graduated++;
          } else {
            await prisma.wrongNote.update({
              where: { id: note.id },
              data: { consecutiveCorrect: newConsecutive },
            });
          }
        } else {
          await prisma.wrongNote.update({
            where: { id: note.id },
            data: {
              consecutiveCorrect: 0,
              wrongCount: { increment: 1 },
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
