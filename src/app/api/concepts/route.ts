import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "ko";
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "3", 10);

    const totalTopics = await prisma.topic.count({
      where: { concepts: { some: {} } },
    });

    const totalConcepts = await prisma.concept.count();

    const topics = await prisma.topic.findMany({
      where: { concepts: { some: {} } },
      include: {
        concepts: {
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
      concepts: topic.concepts.map((c) =>
        lang === "en" && c.name_en ? c.name_en : c.name_ko
      ),
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
