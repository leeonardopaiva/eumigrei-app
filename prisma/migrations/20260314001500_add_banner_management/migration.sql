-- CreateTable
CREATE TABLE "public"."Banner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "regionKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_isActive_regionKey_updatedAt_idx" ON "public"."Banner"("isActive", "regionKey", "updatedAt");

-- AddForeignKey
ALTER TABLE "public"."Banner" ADD CONSTRAINT "Banner_regionKey_fkey" FOREIGN KEY ("regionKey") REFERENCES "public"."Region"("key") ON DELETE SET NULL ON UPDATE CASCADE;

