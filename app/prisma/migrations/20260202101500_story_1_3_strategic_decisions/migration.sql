-- CreateTable
CREATE TABLE "strategic_decisions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_strategic_decisions_client_created_at" ON "strategic_decisions"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_strategic_decisions_author_id" ON "strategic_decisions"("author_id");

-- AddForeignKey
ALTER TABLE "strategic_decisions"
ADD CONSTRAINT "strategic_decisions_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_decisions"
ADD CONSTRAINT "strategic_decisions_author_id_fkey"
FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
