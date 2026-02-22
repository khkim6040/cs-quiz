import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "ko";
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "3", 10);

    // 문제가 연결된 concept이 있는 토픽만 카운트
    const totalTopics = await prisma.topic.count({
      where: { concepts: { some: { questions: { some: {} } } } },
    });

    const totalConcepts = await prisma.concept.count({
      where: { questions: { some: {} } },
    });

    const topics = await prisma.topic.findMany({
      where: { concepts: { some: { questions: { some: {} } } } },
      include: {
        concepts: {
          where: { questions: { some: {} } },
          include: { _count: { select: { questions: true } } },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
      skip: offset,
      take: limit,
    });

    const groups = topics.map((topic) => ({
      topicId: topic.id,
      topicName: lang === "en" && topic.name_en ? topic.name_en : topic.name_ko,
      concepts: topic.concepts.map((c) => ({
        name: lang === "en" && c.name_en ? c.name_en : c.name_ko,
        questionCount: c._count.questions,
      })),
    }));

    return NextResponse.json({
      groups,
      totalTopics,
      totalConcepts,
      hasMore: offset + limit < totalTopics,
    });
  } catch (error) {
    console.error("Failed to fetch concepts:", error);
    return NextResponse.json(
      { error: "Failed to fetch concepts" },
      { status: 500 }
    );
  }
}
