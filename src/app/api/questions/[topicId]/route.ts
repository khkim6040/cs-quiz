import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MAX_BATCH_SIZE = 20;

export async function GET(
  request: Request,
  { params }: { params: { topicId: string } }
) {
  const topicId = params.topicId;
  const { searchParams } = new URL(request.url);
  const count = Math.min(
    Math.max(parseInt(searchParams.get("count") || "1", 10) || 1, 1),
    MAX_BATCH_SIZE
  );

  try {
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

    const where = topicId === "random" ? {} : { topicId };

    if (topicId !== "random") {
      const topicExists = await prisma.topic.findUnique({
        where: { id: topicId },
      });
      if (!topicExists) {
        return NextResponse.json(
          { error: "Invalid topic ID" },
          { status: 400 }
        );
      }
    }

    const totalCount = await prisma.question.count({ where });
    if (totalCount === 0) {
      return NextResponse.json(
        { error: "No questions found" },
        { status: 404 }
      );
    }

    // 랜덤 오프셋으로 batch 크기만큼 가져오기
    const take = Math.min(count, totalCount);
    const maxSkip = Math.max(totalCount - take, 0);
    const skip = Math.floor(Math.random() * (maxSkip + 1));

    const questionsFromDB = await prisma.question.findMany({
      where,
      take,
      skip,
      include: commonInclude,
    });

    if (questionsFromDB.length === 0) {
      return NextResponse.json(
        { error: "No questions found" },
        { status: 404 }
      );
    }

    // 셔플
    for (let i = questionsFromDB.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionsFromDB[i], questionsFromDB[j]] = [questionsFromDB[j], questionsFromDB[i]];
    }

    const formatQuestion = (q: (typeof questionsFromDB)[0]) => {
      const options = q.answerOptions.map((opt) => ({
        id: opt.id,
        text_ko: opt.text_ko,
        text_en: opt.text_en || opt.text_ko,
        rationale_ko: opt.rationale_ko,
        rationale_en: opt.rationale_en || opt.rationale_ko,
        isCorrect: opt.isCorrect,
      }));

      // T/F 문제 판별: 보기가 2개이고 True/False 텍스트인 경우
      const isTrueFalse =
        options.length === 2 &&
        options.some((o) => /^true$/i.test(o.text_en.trim())) &&
        options.some((o) => /^false$/i.test(o.text_en.trim()));

      if (isTrueFalse) {
        // True가 항상 첫 번째
        options.sort((a, b) =>
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
        id: q.id,
        topicId: q.topicId,
        question_ko: q.text_ko,
        question_en: q.text_en || q.text_ko,
        hint_ko: q.hint_ko,
        hint_en: q.hint_en || q.hint_ko,
        answerOptions: options,
      };
    };

    // count=1이면 기존 호환성을 위해 단일 객체 반환
    if (count === 1) {
      return NextResponse.json(formatQuestion(questionsFromDB[0]));
    }

    return NextResponse.json(questionsFromDB.map(formatQuestion));
  } catch (error) {
    console.error(
      `Failed to fetch questions for topic ${topicId} from DB:`,
      error
    );
    return NextResponse.json(
      { error: `Failed to fetch questions for topic ${topicId}` },
      { status: 500 }
    );
  }
}
