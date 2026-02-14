-- CreateIndex
CREATE UNIQUE INDEX "UserScore_userId_dailySetId_key" ON "UserScore"("userId", "dailySetId");
