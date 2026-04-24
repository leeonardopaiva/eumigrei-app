CREATE TYPE "public"."BannerType" AS ENUM ('LINK', 'REGISTRATION');
CREATE TYPE "public"."BannerPlacement" AS ENUM ('HOME', 'FEED', 'BOTH');

ALTER TABLE "public"."Banner"
ADD COLUMN "type" "public"."BannerType" NOT NULL DEFAULT 'LINK';

ALTER TABLE "public"."Banner"
ADD COLUMN "placement" "public"."BannerPlacement" NOT NULL DEFAULT 'HOME';

ALTER TABLE "public"."Banner"
ALTER COLUMN "targetUrl" DROP NOT NULL;

CREATE TABLE "public"."BannerRegistration" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "regionKey" TEXT,
    "locationLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannerRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BannerRegistration_bannerId_userId_key" ON "public"."BannerRegistration"("bannerId", "userId");
CREATE INDEX "BannerRegistration_bannerId_createdAt_idx" ON "public"."BannerRegistration"("bannerId", "createdAt");
CREATE INDEX "BannerRegistration_userId_createdAt_idx" ON "public"."BannerRegistration"("userId", "createdAt");

ALTER TABLE "public"."BannerRegistration"
ADD CONSTRAINT "BannerRegistration_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "public"."Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BannerRegistration"
ADD CONSTRAINT "BannerRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
