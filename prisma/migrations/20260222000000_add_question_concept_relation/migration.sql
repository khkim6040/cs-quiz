-- CreateTable (implicit M:N join table)
CREATE TABLE "_ConceptToQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ConceptToQuestion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ConceptToQuestion_B_index" ON "_ConceptToQuestion"("B");

-- CreateIndex (unique constraint for concept upsert)
CREATE UNIQUE INDEX "Concept_topicId_name_en_key" ON "Concept"("topicId", "name_en");

-- AddForeignKey
ALTER TABLE "_ConceptToQuestion" ADD CONSTRAINT "_ConceptToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConceptToQuestion" ADD CONSTRAINT "_ConceptToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
