-- Link events to a professional business when they are created from professional mode.
ALTER TABLE "public"."Event" ADD COLUMN "businessId" TEXT;

CREATE INDEX "Event_businessId_startsAt_idx" ON "public"."Event"("businessId", "startsAt");

ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
