-- CreateEnum
CREATE TYPE "public"."CommunityGroupMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "public"."CommunityGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "regionKey" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunityGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."CommunityGroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGroup_slug_key" ON "public"."CommunityGroup"("slug");

-- CreateIndex
CREATE INDEX "CommunityGroup_isPublic_createdAt_idx" ON "public"."CommunityGroup"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityGroup_regionKey_createdAt_idx" ON "public"."CommunityGroup"("regionKey", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityGroup_createdById_createdAt_idx" ON "public"."CommunityGroup"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityGroupMember_userId_createdAt_idx" ON "public"."CommunityGroupMember"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityGroupMember_groupId_createdAt_idx" ON "public"."CommunityGroupMember"("groupId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGroupMember_groupId_userId_key" ON "public"."CommunityGroupMember"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "public"."CommunityGroup" ADD CONSTRAINT "CommunityGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityGroup" ADD CONSTRAINT "CommunityGroup_regionKey_fkey" FOREIGN KEY ("regionKey") REFERENCES "public"."Region"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityGroupMember" ADD CONSTRAINT "CommunityGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityGroupMember" ADD CONSTRAINT "CommunityGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
