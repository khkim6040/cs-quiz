// src/app/api/topics/route.ts (개선된 언어 처리)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "ko";

    const dbTopics = await prisma.topic.findMany(); // 모든 언어 데이터 일단 가져오기

    const topics = dbTopics.map((topic) => ({
      id: topic.id,
      name: lang === "en" && topic.name_en ? topic.name_en : topic.name_ko, // 영어 이름이 없을 경우 한국어 이름 사용
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
