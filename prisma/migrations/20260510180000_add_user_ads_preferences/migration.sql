ALTER TABLE "public"."User"
  ADD COLUMN "profileObjective" TEXT,
  ADD COLUMN "adsPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true;
