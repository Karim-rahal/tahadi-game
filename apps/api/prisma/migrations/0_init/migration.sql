-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('FASTEST', 'WHO_AM_I', 'TRUE_FALSE', 'ENUMERATE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SETUP', 'ACTIVE', 'PAUSED', 'FINISHED');

-- CreateEnum
CREATE TYPE "GameQuestionStatus" AS ENUM ('PENDING', 'ACTIVE', 'ANSWERED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TeamSide" AS ENUM ('A', 'B');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalRead" INTEGER NOT NULL DEFAULT 0,
    "inserted" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "report" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "explanation" TEXT,
    "isTrue" BOOLEAN,
    "minimumRequired" INTEGER,
    "topic" TEXT,
    "sect" TEXT,
    "sourceReference" TEXT,
    "sourceUrl" TEXT,
    "sourceVerified" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" TEXT,
    "reviewNotes" TEXT,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT true,
    "acceptedAnswersIncomplete" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "sourceFile" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rawMetadata" JSONB NOT NULL,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionClue" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "QuestionClue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcceptedAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,

    CONSTRAINT "AcceptedAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionReport" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "gameId" TEXT,
    "reason" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'SETUP',
    "tokenHash" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "selection" JSONB NOT NULL,
    "startingTeam" "TeamSide" NOT NULL DEFAULT 'A',
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "winner" "TeamSide",
    "isTie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "side" "TeamSide" NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameQuestion" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "GameQuestionStatus" NOT NULL DEFAULT 'PENDING',
    "cluesRevealed" INTEGER NOT NULL DEFAULT 1,
    "ownerTeam" "TeamSide",
    "answeredCorrect" BOOLEAN,
    "answeredByTeam" "TeamSide",
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "enumState" JSONB,
    "enumActiveTeam" "TeamSide",
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "GameQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerAttempt" (
    "id" TEXT NOT NULL,
    "gameQuestionId" TEXT NOT NULL,
    "team" "TeamSide" NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "cluesRevealedAtAttempt" INTEGER,
    "acceptedAnswerId" TEXT,
    "manualText" TEXT,
    "givenAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnumerationUsedAnswer" (
    "id" TEXT NOT NULL,
    "gameQuestionId" TEXT NOT NULL,
    "acceptedAnswerId" TEXT NOT NULL,
    "team" "TeamSide" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnumerationUsedAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strike" (
    "id" TEXT NOT NULL,
    "gameQuestionId" TEXT NOT NULL,
    "team" "TeamSide" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Strike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pass" (
    "id" TEXT NOT NULL,
    "gameQuestionId" TEXT NOT NULL,
    "team" "TeamSide" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreEvent" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "team" "TeamSide" NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "gameQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameActionHistory" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "inverse" JSONB NOT NULL,
    "undone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameActionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Question_categoryId_type_difficulty_idx" ON "Question"("categoryId", "type", "difficulty");

-- CreateIndex
CREATE INDEX "Question_contentHash_idx" ON "Question"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Question_sourceFile_originalId_key" ON "Question"("sourceFile", "originalId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionClue_questionId_order_key" ON "QuestionClue"("questionId", "order");

-- CreateIndex
CREATE INDEX "AcceptedAnswer_questionId_normalized_idx" ON "AcceptedAnswer"("questionId", "normalized");

-- CreateIndex
CREATE UNIQUE INDEX "AcceptedAnswer_questionId_order_key" ON "AcceptedAnswer"("questionId", "order");

-- CreateIndex
CREATE INDEX "QuestionReport_questionId_idx" ON "QuestionReport"("questionId");

-- CreateIndex
CREATE INDEX "GameSession_tokenHash_idx" ON "GameSession"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Team_gameId_side_key" ON "Team"("gameId", "side");

-- CreateIndex
CREATE INDEX "GameQuestion_gameId_status_idx" ON "GameQuestion"("gameId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GameQuestion_gameId_order_key" ON "GameQuestion"("gameId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "GameQuestion_gameId_questionId_key" ON "GameQuestion"("gameId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "EnumerationUsedAnswer_gameQuestionId_acceptedAnswerId_key" ON "EnumerationUsedAnswer"("gameQuestionId", "acceptedAnswerId");

-- CreateIndex
CREATE INDEX "ScoreEvent_gameId_idx" ON "ScoreEvent"("gameId");

-- CreateIndex
CREATE INDEX "GameActionHistory_gameId_undone_idx" ON "GameActionHistory"("gameId", "undone");

-- CreateIndex
CREATE UNIQUE INDEX "GameActionHistory_gameId_seq_key" ON "GameActionHistory"("gameId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_gameId_key_key" ON "IdempotencyKey"("gameId", "key");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionClue" ADD CONSTRAINT "QuestionClue_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptedAnswer" ADD CONSTRAINT "AcceptedAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuestion" ADD CONSTRAINT "GameQuestion_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuestion" ADD CONSTRAINT "GameQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_gameQuestionId_fkey" FOREIGN KEY ("gameQuestionId") REFERENCES "GameQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnumerationUsedAnswer" ADD CONSTRAINT "EnumerationUsedAnswer_gameQuestionId_fkey" FOREIGN KEY ("gameQuestionId") REFERENCES "GameQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnumerationUsedAnswer" ADD CONSTRAINT "EnumerationUsedAnswer_acceptedAnswerId_fkey" FOREIGN KEY ("acceptedAnswerId") REFERENCES "AcceptedAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strike" ADD CONSTRAINT "Strike_gameQuestionId_fkey" FOREIGN KEY ("gameQuestionId") REFERENCES "GameQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pass" ADD CONSTRAINT "Pass_gameQuestionId_fkey" FOREIGN KEY ("gameQuestionId") REFERENCES "GameQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreEvent" ADD CONSTRAINT "ScoreEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameActionHistory" ADD CONSTRAINT "GameActionHistory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

