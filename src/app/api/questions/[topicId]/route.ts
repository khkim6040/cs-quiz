import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import { questionsData, topicsData } from '@/lib/quizData'; // DB 사용으로 대체
import { Topic } from "@prisma/client"; // Prisma가 생성한 타입 사용 가능

export async function GET(
  request: Request,
  { params }: { params: { topicId: string } }
) {
  const topicId = params.topicId;
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "ko"; // 기본값 한국어

  try {
    let questionsFromDB;

    const commonInclude = {
      answerOptions: {
        select: {
          id: true,
          text_ko: true,
          text_en: true,
          rationale_ko: true,
          rationale_en: true,
          isCorrect: true,
        },
      },
    };

    if (topicId === "random") {
      // 모든 질문을 가져와서 랜덤으로 하나 선택 (DB에서 직접 랜덤 선택은 DB 종류에 따라 다름)
      // 여기서는 모든 질문 ID를 가져와서 랜덤으로 하나를 다시 쿼리하거나,
      // 모든 질문을 가져온 후 애플리케이션 레벨에서 랜덤 선택
      const allQuestionsCount = await prisma.question.count();
      if (allQuestionsCount === 0)
        return NextResponse.json(
          { error: "No questions found" },
          { status: 404 }
        );

      const randomIndex = Math.floor(Math.random() * allQuestionsCount);
      const randomQuestionRecords = await prisma.question.findMany({
        take: 1,
        skip: randomIndex,
        include: commonInclude,
      });
      if (!randomQuestionRecords || randomQuestionRecords.length === 0) {
        return NextResponse.json(
          { error: "No questions found" },
          { status: 404 }
        );
      }
      questionsFromDB = randomQuestionRecords[0];
    } else {
      // 특정 주제의 질문 중 랜덤으로 하나 선택
      // 먼저 해당 topicId가 유효한지 확인 (선택적)
      const topicExists = await prisma.topic.findUnique({
        where: { id: topicId },
      });
      if (!topicExists) {
        return NextResponse.json(
          { error: "Invalid topic ID" },
          { status: 400 }
        );
      }

      const questionsInTopicCount = await prisma.question.count({
        where: { topicId },
      });
      if (questionsInTopicCount === 0)
        return NextResponse.json(
          { error: "No questions found for this topic" },
          { status: 404 }
        );

      const randomIndex = Math.floor(Math.random() * questionsInTopicCount);
      const randomQuestionRecords = await prisma.question.findMany({
        where: { topicId },
        take: 1,
        skip: randomIndex,
        include: commonInclude,
      });
      if (!randomQuestionRecords || randomQuestionRecords.length === 0) {
        return NextResponse.json(
          { error: "No questions found for this topic" },
          { status: 404 }
        );
      }
      questionsFromDB = randomQuestionRecords[0];
    }

    if (!questionsFromDB) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // 언어에 따라 텍스트 변환
    const question = {
      id: questionsFromDB.id,
      topicId: questionsFromDB.topicId,
      question:
        lang === "en" && questionsFromDB.text_en
          ? questionsFromDB.text_en
          : questionsFromDB.text_ko,
      hint:
        lang === "en" && questionsFromDB.hint_en
          ? questionsFromDB.hint_en
          : questionsFromDB.hint_ko,
      answerOptions: questionsFromDB.answerOptions.map((opt) => ({
        id: opt.id,
        text: lang === "en" && opt.text_en ? opt.text_en : opt.text_ko,
        rationale:
          lang === "en" && opt.rationale_en
            ? opt.rationale_en
            : opt.rationale_ko,
        isCorrect: opt.isCorrect,
      })),
    };

    return NextResponse.json(question);
  } catch (error) {
    console.error(
      `Failed to fetch question for topic ${topicId} from DB:`,
      error
    );
    return NextResponse.json(
      { error: `Failed to fetch question for topic ${topicId}` },
      { status: 500 }
    );
  }
}
