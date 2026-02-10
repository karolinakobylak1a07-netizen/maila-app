ALTER TABLE "client_profiles"
ADD COLUMN "owner_email" TEXT,
ADD COLUMN "internal_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "internal_profile_filter" JSONB;
