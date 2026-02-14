-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name_ko" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "text_ko" TEXT NOT NULL,
    "text_en" TEXT NOT NULL,
    "hint_ko" TEXT NOT NULL,
    "hint_en" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text_ko" TEXT NOT NULL,
    "text_en" TEXT NOT NULL,
    "rationale_ko" TEXT NOT NULL,
    "rationale_en" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "AnswerOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuestionSet" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "questionIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailySetId" TEXT NOT NULL,
    "topicId" TEXT,
    "score" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestionSet_date_key" ON "DailyQuestionSet"("date");

-- CreateIndex
CREATE INDEX "UserScore_dailySetId_score_idx" ON "UserScore"("dailySetId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "UserScore_userId_dailySetId_topicId_key" ON "UserScore"("userId", "dailySetId", "topicId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerOption" ADD CONSTRAINT "AnswerOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserScore" ADD CONSTRAINT "UserScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserScore" ADD CONSTRAINT "UserScore_dailySetId_fkey" FOREIGN KEY ("dailySetId") REFERENCES "DailyQuestionSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
