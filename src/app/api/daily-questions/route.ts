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

    const formattedQuestions = orderedQuestions.map((question: any) => {
      const options = question.answerOptions.map((option: any) => ({
        id: option.id,
        text_ko: option.text_ko,
        text_en: option.text_en || option.text_ko,
        rationale_ko: option.rationale_ko,
        rationale_en: option.rationale_en || option.rationale_ko,
        isCorrect: option.isCorrect,
      }));

      // T/F 문제 판별: 보기가 2개이고 True/False 텍스트인 경우
      const isTrueFalse =
        options.length === 2 &&
        options.some((o: any) => /^true$/i.test(o.text_en.trim())) &&
        options.some((o: any) => /^false$/i.test(o.text_en.trim()));

      if (isTrueFalse) {
        // True가 항상 첫 번째
        options.sort((a: any, b: any) =>
          /^true$/i.test(a.text_en.trim()) ? -1 : 1
        );
      } else {
        // Fisher-Yates 셔플
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
      }

      return {
        id: question.id,
        topicId: question.topicId,
        topicName_ko: question.topic.name_ko,
        topicName_en: question.topic.name_en || question.topic.name_ko,
        question_ko: question.text_ko,
        question_en: question.text_en || question.text_ko,
        hint_ko: question.hint_ko,
        hint_en: question.hint_en || question.hint_ko,
        answerOptions: options,
      };
    });

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
