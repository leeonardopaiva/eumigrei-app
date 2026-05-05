-- Track billable ad activity so daily and total budgets can be audited.
CREATE TABLE "public"."AdCharge" (
  "id" TEXT NOT NULL,
  "bannerId" TEXT NOT NULL,
  "userId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "billingMode" "public"."AdBillingMode" NOT NULL,
  "sourceType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdCharge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdCharge_bannerId_createdAt_idx" ON "public"."AdCharge"("bannerId", "createdAt");
CREATE INDEX "AdCharge_userId_createdAt_idx" ON "public"."AdCharge"("userId", "createdAt");

ALTER TABLE "public"."AdCharge" ADD CONSTRAINT "AdCharge_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "public"."Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AdCharge" ADD CONSTRAINT "AdCharge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
