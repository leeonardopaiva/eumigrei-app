-- Allow community posts to be displayed as a professional page while keeping
-- the owning user as the canonical author for permissions and moderation.
ALTER TABLE "public"."CommunityPost" ADD COLUMN "businessAuthorId" TEXT;

CREATE INDEX "CommunityPost_businessAuthorId_createdAt_idx" ON "public"."CommunityPost"("businessAuthorId", "createdAt");

ALTER TABLE "public"."CommunityPost" ADD CONSTRAINT "CommunityPost_businessAuthorId_fkey" FOREIGN KEY ("businessAuthorId") REFERENCES "public"."Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
