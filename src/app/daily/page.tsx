import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { getTodayInKST } from '@/lib/timezone';
import DailyQuizContent, { DailyQuestion } from '@/components/DailyQuizContent';

function getDailyQuizData() {
  const today = getTodayInKST();
  const todayKey = today.toISOString().slice(0, 10);
  return unstable_cache(
    async () => {

      const dailySet = await prisma.dailyQuestionSet.findUnique({
        where: { date: today },
      });

      if (!dailySet) {
        return { dailySetId: null, questions: [] };
      }

      const questionIds = dailySet.questionIds;

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

      const formattedQuestions = orderedQuestions.map((question) => {
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

      return {
        dailySetId: dailySet.id,
        questions: formattedQuestions,
      };
    },
    [`daily-questions-${todayKey}`],
    { revalidate: 43200 }
  )();
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
