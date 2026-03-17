-- CreateEnum
CREATE TYPE "public"."SuggestionCategory" AS ENUM ('FUNCTIONALITY', 'IMPROVEMENT');

-- CreateEnum
CREATE TYPE "public"."SuggestionStatus" AS ENUM ('NEW', 'REVIEWED');

-- CreateTable
CREATE TABLE "public"."Suggestion" (
    "id" TEXT NOT NULL,
    "category" "public"."SuggestionCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "public"."SuggestionStatus" NOT NULL DEFAULT 'NEW',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Suggestion_status_createdAt_idx" ON "public"."Suggestion"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Suggestion_userId_createdAt_idx" ON "public"."Suggestion"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Suggestion" ADD CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
