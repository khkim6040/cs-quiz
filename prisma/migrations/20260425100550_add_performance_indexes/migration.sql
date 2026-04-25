-- AlterTable
ALTER TABLE "QuizSession" ALTER COLUMN "wrongQuestionIds" SET DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "AnswerOption_questionId_idx" ON "AnswerOption"("questionId");

-- CreateIndex
CREATE INDEX "Question_topicId_idx" ON "Question"("topicId");
