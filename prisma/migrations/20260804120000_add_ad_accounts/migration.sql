-- CreateEnum
CREATE TYPE "AdAccountRole" AS ENUM ('BUSINESS_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "AdAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "businessCategory" TEXT,
    "subcategories" TEXT[] NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isAgency" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdAccountUser" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AdAccountRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdAccountUser_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN "adAccountId" TEXT;

-- AlterTable
ALTER TABLE "AdPayment" ALTER COLUMN "provider" SET DEFAULT 'STRIPE';

-- CreateIndex
CREATE INDEX "AdAccount_name_idx" ON "AdAccount"("name");

-- CreateIndex
CREATE INDEX "AdAccount_businessCategory_idx" ON "AdAccount"("businessCategory");

-- CreateIndex
CREATE UNIQUE INDEX "AdAccountUser_adAccountId_userId_key" ON "AdAccountUser"("adAccountId", "userId");

-- CreateIndex
CREATE INDEX "AdAccountUser_userId_createdAt_idx" ON "AdAccountUser"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Banner_adAccountId_updatedAt_idx" ON "Banner"("adAccountId", "updatedAt");

-- AddForeignKey
ALTER TABLE "AdAccountUser" ADD CONSTRAINT "AdAccountUser_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAccountUser" ADD CONSTRAINT "AdAccountUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
