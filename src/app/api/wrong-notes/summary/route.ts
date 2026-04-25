import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const [activeCount, resolvedCount] = await Promise.all([
      prisma.wrongNote.count({ where: { userId, status: "ACTIVE" } }),
      prisma.wrongNote.count({ where: { userId, status: "RESOLVED" } }),
    ]);

    const byTopicRaw = await prisma.wrongNote.findMany({
      where: { userId, status: "ACTIVE" },
      select: {
        question: {
          select: {
            topic: { select: { id: true, name_ko: true, name_en: true } },
          },
        },
      },
    });

    const topicCountMap = new Map<string, { name_ko: string; name_en: string; count: number }>();
    for (const note of byTopicRaw) {
      const topic = note.question.topic;
      const existing = topicCountMap.get(topic.id);
      if (existing) {
        existing.count++;
      } else {
        topicCountMap.set(topic.id, { name_ko: topic.name_ko, name_en: topic.name_en, count: 1 });
      }
    }

    const byTopic = Array.from(topicCountMap.entries())
      .map(([topicId, data]) => ({ topicId, ...data }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ activeCount, resolvedCount, byTopic });
  } catch (error) {
    console.error("Failed to get wrong notes summary:", error);
    return NextResponse.json({ error: "Failed to get wrong notes summary" }, { status: 500 });
  }
}
