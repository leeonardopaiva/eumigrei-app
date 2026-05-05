-- Extend banners into Ads Lite campaigns with targeting, billing metadata, and impression tracking.
CREATE TYPE "public"."AdCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');
CREATE TYPE "public"."AdObjective" AS ENUM ('TRAFFIC', 'LEAD', 'AWARENESS');
CREATE TYPE "public"."AdBillingMode" AS ENUM ('FLAT', 'CPC', 'CPM', 'CPL');
CREATE TYPE "public"."AdPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED');

ALTER TABLE "public"."Banner"
  ADD COLUMN "campaignStatus" "public"."AdCampaignStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "objective" "public"."AdObjective" NOT NULL DEFAULT 'TRAFFIC',
  ADD COLUMN "billingMode" "public"."AdBillingMode" NOT NULL DEFAULT 'FLAT',
  ADD COLUMN "paymentStatus" "public"."AdPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "targetInterests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "targetKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "targetCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "startsAt" TIMESTAMP(3),
  ADD COLUMN "endsAt" TIMESTAMP(3),
  ADD COLUMN "dailyBudgetCents" INTEGER,
  ADD COLUMN "totalBudgetCents" INTEGER,
  ADD COLUMN "bidCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "spentCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "checkoutUrl" TEXT,
  ADD COLUMN "paymentProvider" TEXT;

CREATE TABLE "public"."AdImpression" (
  "id" TEXT NOT NULL,
  "bannerId" TEXT NOT NULL,
  "userId" TEXT,
  "placement" "public"."BannerPlacement" NOT NULL,
  "sourcePath" TEXT,
  "sourceSection" TEXT,
  "regionKey" TEXT,
  "matchedBy" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdImpression_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Banner_campaignStatus_startsAt_endsAt_idx" ON "public"."Banner"("campaignStatus", "startsAt", "endsAt");
CREATE INDEX "Banner_paymentStatus_updatedAt_idx" ON "public"."Banner"("paymentStatus", "updatedAt");
CREATE INDEX "AdImpression_bannerId_createdAt_idx" ON "public"."AdImpression"("bannerId", "createdAt");
CREATE INDEX "AdImpression_userId_createdAt_idx" ON "public"."AdImpression"("userId", "createdAt");
CREATE INDEX "AdImpression_placement_createdAt_idx" ON "public"."AdImpression"("placement", "createdAt");

ALTER TABLE "public"."AdImpression" ADD CONSTRAINT "AdImpression_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "public"."Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AdImpression" ADD CONSTRAINT "AdImpression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
