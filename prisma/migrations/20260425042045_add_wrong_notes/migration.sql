/*
  Warnings:

  - The primary key for the `_ConceptToQuestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_ConceptToQuestion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WrongNoteStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- AlterTable
ALTER TABLE "QuizSession" ADD COLUMN     "wrongQuestionIds" TEXT[];

-- AlterTable
ALTER TABLE "_ConceptToQuestion" DROP CONSTRAINT "_ConceptToQuestion_AB_pkey";

-- CreateTable
CREATE TABLE "WrongNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "status" "WrongNoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "wrongCount" INTEGER NOT NULL DEFAULT 1,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WrongNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WrongNote_userId_status_idx" ON "WrongNote"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WrongNote_userId_questionId_key" ON "WrongNote"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptToQuestion_AB_unique" ON "_ConceptToQuestion"("A", "B");

-- AddForeignKey
ALTER TABLE "WrongNote" ADD CONSTRAINT "WrongNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrongNote" ADD CONSTRAINT "WrongNote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
