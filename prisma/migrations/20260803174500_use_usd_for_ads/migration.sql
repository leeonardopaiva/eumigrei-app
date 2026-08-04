-- Ads contracts and payments are denominated exclusively in US dollars.
ALTER TABLE "public"."AdPayment" ALTER COLUMN "currency" SET DEFAULT 'USD';
UPDATE "public"."AdPayment" SET "currency" = 'USD' WHERE "currency" <> 'USD';
