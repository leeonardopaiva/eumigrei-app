-- CreateEnum
CREATE TYPE "public"."VisibilityScope" AS ENUM ('GLOBAL', 'USER_REGION', 'SPECIFIC_REGION');

-- CreateEnum
CREATE TYPE "public"."FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "public"."Business" ADD COLUMN     "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibilityRegionKey" TEXT,
ADD COLUMN     "visibilityScope" "public"."VisibilityScope" NOT NULL DEFAULT 'USER_REGION';

-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibilityRegionKey" TEXT,
ADD COLUMN     "visibilityScope" "public"."VisibilityScope" NOT NULL DEFAULT 'USER_REGION';

-- CreateTable
CREATE TABLE "public"."BusinessFavorite" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventFavorite" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessRating" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventRating" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FriendRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "public"."FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessFavorite_userId_createdAt_idx" ON "public"."BusinessFavorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessFavorite_businessId_userId_key" ON "public"."BusinessFavorite"("businessId", "userId");

-- CreateIndex
CREATE INDEX "EventFavorite_userId_createdAt_idx" ON "public"."EventFavorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventFavorite_eventId_userId_key" ON "public"."EventFavorite"("eventId", "userId");

-- CreateIndex
CREATE INDEX "BusinessRating_businessId_updatedAt_idx" ON "public"."BusinessRating"("businessId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRating_businessId_userId_key" ON "public"."BusinessRating"("businessId", "userId");

-- CreateIndex
CREATE INDEX "EventRating_eventId_updatedAt_idx" ON "public"."EventRating"("eventId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventRating_eventId_userId_key" ON "public"."EventRating"("eventId", "userId");

-- CreateIndex
CREATE INDEX "FriendRequest_recipientId_status_createdAt_idx" ON "public"."FriendRequest"("recipientId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_requesterId_recipientId_key" ON "public"."FriendRequest"("requesterId", "recipientId");

-- CreateIndex
CREATE INDEX "Business_visibilityScope_visibilityRegionKey_idx" ON "public"."Business"("visibilityScope", "visibilityRegionKey");

-- CreateIndex
CREATE INDEX "Event_visibilityScope_visibilityRegionKey_startsAt_idx" ON "public"."Event"("visibilityScope", "visibilityRegionKey", "startsAt");

-- AddForeignKey
ALTER TABLE "public"."Business" ADD CONSTRAINT "Business_visibilityRegionKey_fkey" FOREIGN KEY ("visibilityRegionKey") REFERENCES "public"."Region"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_visibilityRegionKey_fkey" FOREIGN KEY ("visibilityRegionKey") REFERENCES "public"."Region"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessFavorite" ADD CONSTRAINT "BusinessFavorite_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessFavorite" ADD CONSTRAINT "BusinessFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventFavorite" ADD CONSTRAINT "EventFavorite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventFavorite" ADD CONSTRAINT "EventFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessRating" ADD CONSTRAINT "BusinessRating_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessRating" ADD CONSTRAINT "BusinessRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventRating" ADD CONSTRAINT "EventRating_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventRating" ADD CONSTRAINT "EventRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
