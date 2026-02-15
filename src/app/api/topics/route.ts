// src/app/api/topics/route.ts (개선된 언어 처리)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "ko";

    const dbTopics = await prisma.topic.findMany({
      include: { _count: { select: { questions: true } } },
    });

    const topics = dbTopics.map((topic) => ({
      id: topic.id,
      name: lang === "en" && topic.name_en ? topic.name_en : topic.name_ko,
      questionCount: topic._count.questions,
    }));

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Failed to fetch topics from DB:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
