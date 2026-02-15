// src/app/api/daily-questions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTodayInKST } from "@/lib/timezone";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const today = getTodayInKST();

    console.log("[Daily Questions API] Looking for date:", today.toISOString());

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
      .map((id: string) => questions.find((q: any) => q.id === id))
      .filter((q: any): q is NonNullable<typeof q> => q !== undefined);

    const formattedQuestions = orderedQuestions.map((question: any) => ({
      id: question.id,
      topicId: question.topicId,
      topicName_ko: question.topic.name_ko,
      topicName_en: question.topic.name_en || question.topic.name_ko,
      question_ko: question.text_ko,
      question_en: question.text_en || question.text_ko,
      hint_ko: question.hint_ko,
      hint_en: question.hint_en || question.hint_ko,
      answerOptions: question.answerOptions.map((option: any) => ({
        id: option.id,
        text_ko: option.text_ko,
        text_en: option.text_en || option.text_ko,
        rationale_ko: option.rationale_ko,
        rationale_en: option.rationale_en || option.rationale_ko,
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
