-- Add the advertiser-facing campaign contract and moderation workflow.
CREATE TYPE "public"."AdGoal" AS ENUM ('WHATSAPP', 'EXTERNAL_URL', 'MARKETPLACE');
CREATE TYPE "public"."AdPlan" AS ENUM ('BRONZE', 'SILVER', 'GOLD');
CREATE TYPE "public"."AdModerationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- Existing NOT_REQUIRED banners are legacy inventory and remain eligible to be served.
ALTER TYPE "public"."AdPaymentStatus" RENAME TO "AdPaymentStatus_old";
CREATE TYPE "public"."AdPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
ALTER TABLE "public"."Banner"
  ALTER COLUMN "paymentStatus" DROP DEFAULT,
  ALTER COLUMN "paymentStatus" TYPE "public"."AdPaymentStatus"
  USING (CASE WHEN "paymentStatus"::text = 'NOT_REQUIRED' THEN 'PAID' ELSE "paymentStatus"::text END)::"public"."AdPaymentStatus",
  ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
DROP TYPE "public"."AdPaymentStatus_old";

ALTER TABLE "public"."Banner"
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "goal" "public"."AdGoal",
  ADD COLUMN "headline" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "ctaLabel" TEXT,
  ADD COLUMN "whatsappNumber" TEXT,
  ADD COLUMN "marketplaceItemId" TEXT,
  ADD COLUMN "plan" "public"."AdPlan",
  ADD COLUMN "durationMonths" INTEGER,
  ADD COLUMN "contractAmountCents" INTEGER,
  ADD COLUMN "moderationStatus" "public"."AdModerationStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "rejectionReason" TEXT;

-- Banners created before the advertiser wizard were already curated by administrators.
UPDATE "public"."Banner"
SET "moderationStatus" = 'APPROVED',
    "approvedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);

CREATE TABLE "public"."AdPayment" (
  "id" TEXT NOT NULL,
  "bannerId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerSessionId" TEXT,
  "providerPaymentId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "status" "public"."AdPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  CONSTRAINT "AdPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdPayment_providerSessionId_key" ON "public"."AdPayment"("providerSessionId");
CREATE UNIQUE INDEX "AdPayment_providerPaymentId_key" ON "public"."AdPayment"("providerPaymentId");
CREATE INDEX "AdPayment_bannerId_createdAt_idx" ON "public"."AdPayment"("bannerId", "createdAt");
CREATE INDEX "AdPayment_status_updatedAt_idx" ON "public"."AdPayment"("status", "updatedAt");
CREATE INDEX "Banner_createdById_updatedAt_idx" ON "public"."Banner"("createdById", "updatedAt");
CREATE INDEX "Banner_moderationStatus_paymentStatus_updatedAt_idx" ON "public"."Banner"("moderationStatus", "paymentStatus", "updatedAt");

ALTER TABLE "public"."Banner" ADD CONSTRAINT "Banner_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Banner" ADD CONSTRAINT "Banner_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."AdPayment" ADD CONSTRAINT "AdPayment_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "public"."Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
