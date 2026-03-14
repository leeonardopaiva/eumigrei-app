-- CreateTable
CREATE TABLE "public"."EmailChangeToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailChangeToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailChangeToken_tokenHash_key" ON "public"."EmailChangeToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailChangeToken_newEmail_expiresAt_idx" ON "public"."EmailChangeToken"("newEmail", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailChangeToken_userId_newEmail_key" ON "public"."EmailChangeToken"("userId", "newEmail");

-- AddForeignKey
ALTER TABLE "public"."EmailChangeToken" ADD CONSTRAINT "EmailChangeToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
