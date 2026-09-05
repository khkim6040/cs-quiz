import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { getTodayInKST } from '@/lib/timezone';
import DailyQuizContent, { DailyQuestion } from '@/components/DailyQuizContent';

export const dynamic = 'force-dynamic';

// dailySetId가 가리키는 문제 내용은 절대 바뀌지 않으므로 무제한 캐싱해도 안전하다.
const getCachedQuestions = (dailySetId: string, questionIds: string[]) =>
  unstable_cache(
    async () => {
      const questions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
        include: {
          answerOptions: true,
          topic: true,
        },
      });

      const orderedQuestions = questionIds
        .map((id: string) => questions.find((q) => q.id === id))
        .filter((q): q is NonNullable<typeof q> => q !== undefined);

      return orderedQuestions.map((question) => {
        const options = question.answerOptions.map((option) => ({
          id: option.id,
          text_ko: option.text_ko,
          text_en: option.text_en || option.text_ko,
          rationale_ko: option.rationale_ko,
          rationale_en: option.rationale_en || option.rationale_ko,
          isCorrect: option.isCorrect,
        }));

        const isTrueFalse =
          options.length === 2 &&
          options.some((o) => /^true$/i.test(o.text_en.trim())) &&
          options.some((o) => /^false$/i.test(o.text_en.trim()));

        if (isTrueFalse) {
          options.sort((a, b) =>
            /^true$/i.test(a.text_en.trim()) ? -1 : 1
          );
        } else {
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
          difficulty: question.difficulty,
          answerOptions: options,
        };
      });
    },
    ['daily-quiz-questions', dailySetId],
    { revalidate: false }
  )();

async function getDailyQuizData() {
  const today = getTodayInKST();

  const dailySet = await prisma.dailyQuestionSet.findUnique({
    where: { date: today },
  });

  if (!dailySet) {
    return { dailySetId: null, questions: [] };
  }

  const questions = await getCachedQuestions(dailySet.id, dailySet.questionIds);

  return {
    dailySetId: dailySet.id,
    questions,
  };
}

export default async function DailyQuizPage() {
  let dailySetId: string | null = null;
  let questions: DailyQuestion[] = [];

  try {
    const data = await getDailyQuizData();
    dailySetId = data.dailySetId;
    questions = data.questions;
  } catch (error) {
    console.error('Failed to fetch daily quiz data:', error);
  }

  return <DailyQuizContent questions={questions} dailySetId={dailySetId} />;
}
