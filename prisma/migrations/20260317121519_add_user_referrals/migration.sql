-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "referredById" TEXT;

-- CreateIndex
CREATE INDEX "User_referredById_createdAt_idx" ON "public"."User"("referredById", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
