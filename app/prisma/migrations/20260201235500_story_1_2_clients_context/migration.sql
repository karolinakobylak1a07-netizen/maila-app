-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STRATEGY', 'CONTENT', 'OPERATIONS');

-- CreateEnum
CREATE TYPE "ClientProfileStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'OWNER';

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ClientProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_memberships" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_user_context" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "last_view_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_user_context_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_client_profiles_name" ON "client_profiles"("name");

-- CreateIndex
CREATE INDEX "idx_client_profiles_status" ON "client_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_client_memberships_client_user" ON "client_memberships"("client_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_client_memberships_user_id" ON "client_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_client_user_context_user_client" ON "client_user_context"("user_id", "client_id");

-- CreateIndex
CREATE INDEX "idx_client_user_context_client_id" ON "client_user_context"("client_id");

-- AddForeignKey
ALTER TABLE "client_memberships"
ADD CONSTRAINT "client_memberships_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_memberships"
ADD CONSTRAINT "client_memberships_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_user_context"
ADD CONSTRAINT "client_user_context_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_user_context"
ADD CONSTRAINT "client_user_context_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
