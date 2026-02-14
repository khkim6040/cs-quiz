// src/app/api/daily-questions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "ko";

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 오늘의 문제 세트 조회
    const dailySet = await prisma.dailyQuestionSet.findUnique({
      where: { date: today },
    });

    // 오늘의 세트가 없으면 에러 반환
    if (!dailySet) {
      return NextResponse.json(
        { error: "Daily question set not found. Please run the daily generation batch script." },
        { status: 404 }
      );
    }

    const questionIds = dailySet.questionIds;

    // 문제들 조회
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
      include: {
        answerOptions: true,
        topic: true,
      },
    });

    // 순서 유지하며 변환
    const orderedQuestions = questionIds
      .map(id => questions.find(q => q.id === id))
      .filter(q => q !== undefined);

    const formattedQuestions = orderedQuestions.map((question) => ({
      id: question.id,
      topicId: question.topicId,
      topicName: lang === "en" ? question.topic.name_en : question.topic.name_ko,
      question: lang === "en" ? question.text_en : question.text_ko,
      hint: lang === "en" ? question.hint_en : question.hint_ko,
      answerOptions: question.answerOptions.map((option) => ({
        text: lang === "en" ? option.text_en : option.text_ko,
        rationale: lang === "en" ? option.rationale_en : option.rationale_ko,
        isCorrect: option.isCorrect,
      })),
    }));

    return NextResponse.json({
      dailySetId: dailySet.id,
      date: dailySet.date,
      questions: formattedQuestions,
    });
  } catch (error) {
    console.error("Failed to get daily questions:", error);
    return NextResponse.json(
      { error: "Failed to get daily questions" },
      { status: 500 }
    );
  }
}
