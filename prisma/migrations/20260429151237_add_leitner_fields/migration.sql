-- AlterTable
ALTER TABLE "WrongNote" ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "leitnerBox" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nextReviewAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WrongNote_userId_nextReviewAt_idx" ON "WrongNote"("userId", "nextReviewAt");
