-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "name_ko" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Concept_topicId_idx" ON "Concept"("topicId");

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
