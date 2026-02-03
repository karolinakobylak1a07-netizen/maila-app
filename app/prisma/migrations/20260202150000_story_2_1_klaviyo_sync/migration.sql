-- CreateEnum
CREATE TYPE "KlaviyoSyncStatus" AS ENUM (
    'IN_PROGRESS',
    'OK',
    'FAILED_AUTH',
    'PARTIAL_OR_TIMEOUT'
);

-- CreateEnum
CREATE TYPE "SyncTrigger" AS ENUM (
    'MANUAL',
    'DAILY'
);

-- CreateEnum
CREATE TYPE "KlaviyoEntityType" AS ENUM (
    'ACCOUNT',
    'FLOW',
    'EMAIL',
    'FORM'
);

-- CreateTable
CREATE TABLE "klaviyo_sync_runs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "trigger" "SyncTrigger" NOT NULL,
    "status" "KlaviyoSyncStatus" NOT NULL,
    "request_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "account_count" INTEGER NOT NULL DEFAULT 0,
    "flow_count" INTEGER NOT NULL DEFAULT 0,
    "email_count" INTEGER NOT NULL DEFAULT 0,
    "form_count" INTEGER NOT NULL DEFAULT 0,
    "error_code" TEXT,
    "error_message" TEXT,

    CONSTRAINT "klaviyo_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "klaviyo_inventory_items" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "entity_type" "KlaviyoEntityType" NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "item_status" TEXT NOT NULL DEFAULT 'OK',
    "last_sync_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "klaviyo_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_klaviyo_sync_runs_client_started_at"
ON "klaviyo_sync_runs"("client_id", "started_at");

-- CreateIndex
CREATE INDEX "idx_klaviyo_sync_runs_request_id"
ON "klaviyo_sync_runs"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_klaviyo_inventory_client_entity_external"
ON "klaviyo_inventory_items"("client_id", "entity_type", "external_id");

-- CreateIndex
CREATE INDEX "idx_klaviyo_inventory_client_entity"
ON "klaviyo_inventory_items"("client_id", "entity_type");

-- AddForeignKey
ALTER TABLE "klaviyo_sync_runs"
ADD CONSTRAINT "klaviyo_sync_runs_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "klaviyo_inventory_items"
ADD CONSTRAINT "klaviyo_inventory_items_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
