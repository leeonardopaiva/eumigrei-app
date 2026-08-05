-- AlterTable
ALTER TABLE "public"."AdAccount"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "businessAddress" TEXT,
  ADD COLUMN "useWebsitePhotos" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."User"
  ADD COLUMN "marketingEmailsOptOut" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'pt-BR';
