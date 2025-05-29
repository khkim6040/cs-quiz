import { NextResponse } from "next/server";
import { questionsData, topicsData } from "@/lib/quizData";

export async function GET(
  request: Request,
  { params }: { params: { topicId: string } }
) {
  try {
    const { topicId } = params;

    // 랜덤 퀴즈인 경우 모든 문제에서 무작위로 선택
    if (topicId === "random") {
      const randomIndex = Math.floor(Math.random() * questionsData.length);
      return NextResponse.json(questionsData[randomIndex]);
    }

    // 특정 주제의 문제만 필터링
    const topicQuestions = questionsData.filter((q) => q.topicId === topicId);

    // 주제가 존재하는지 확인
    const topicExists = topicsData.some((t) => t.id === topicId);
    if (!topicExists) {
      return NextResponse.json(
        { error: "존재하지 않는 주제입니다." },
        { status: 400 }
      );
    }

    // 해당 주제의 문제가 없는 경우
    if (topicQuestions.length === 0) {
      return NextResponse.json(
        { error: "해당 주제의 문제가 없습니다." },
        { status: 404 }
      );
    }

    // 무작위로 문제 선택
    const randomIndex = Math.floor(Math.random() * topicQuestions.length);
    return NextResponse.json(topicQuestions[randomIndex]);
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "문제를 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
