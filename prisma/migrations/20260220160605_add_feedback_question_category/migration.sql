-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "category" TEXT,
ADD COLUMN     "questionId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Feedback_questionId_idx" ON "Feedback"("questionId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;
