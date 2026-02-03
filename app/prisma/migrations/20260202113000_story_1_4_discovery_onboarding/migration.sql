-- CreateTable
CREATE TABLE "discovery_onboarding" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,
    "answer_count" INTEGER NOT NULL DEFAULT 0,
    "is_goals_complete" BOOLEAN NOT NULL DEFAULT false,
    "is_segments_complete" BOOLEAN NOT NULL DEFAULT false,
    "is_seasonality_complete" BOOLEAN NOT NULL DEFAULT false,
    "is_offer_complete" BOOLEAN NOT NULL DEFAULT false,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_answers" (
    "id" TEXT NOT NULL,
    "discovery_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "question_key" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discovery_onboarding_client_id_key" ON "discovery_onboarding"("client_id");

-- CreateIndex
CREATE INDEX "idx_discovery_onboarding_updated_by_id" ON "discovery_onboarding"("updated_by_id");

-- CreateIndex
CREATE INDEX "idx_discovery_onboarding_is_complete" ON "discovery_onboarding"("is_complete");

-- CreateIndex
CREATE UNIQUE INDEX "uq_discovery_answers_discovery_question" ON "discovery_answers"("discovery_id", "question_key");

-- CreateIndex
CREATE INDEX "idx_discovery_answers_author_id" ON "discovery_answers"("author_id");

-- CreateIndex
CREATE INDEX "idx_discovery_answers_question_key" ON "discovery_answers"("question_key");

-- AddForeignKey
ALTER TABLE "discovery_onboarding"
ADD CONSTRAINT "discovery_onboarding_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_onboarding"
ADD CONSTRAINT "discovery_onboarding_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_answers"
ADD CONSTRAINT "discovery_answers_discovery_id_fkey"
FOREIGN KEY ("discovery_id") REFERENCES "discovery_onboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_answers"
ADD CONSTRAINT "discovery_answers_author_id_fkey"
FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
