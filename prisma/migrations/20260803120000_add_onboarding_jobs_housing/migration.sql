CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
CREATE TYPE "TimeAbroad" AS ENUM ('LESS_THAN_ONE_YEAR', 'ONE_TO_THREE_YEARS', 'THREE_TO_FIVE_YEARS', 'MORE_THAN_FIVE_YEARS');

ALTER TABLE "User"
ADD COLUMN "gender" "Gender",
ADD COLUMN "age" INTEGER,
ADD COLUMN "timeAbroad" "TimeAbroad",
ADD COLUMN "birthCity" TEXT;

CREATE TABLE "Job" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "employmentType" TEXT NOT NULL,
  "locationLabel" TEXT NOT NULL,
  "salary" TEXT,
  "contactUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Housing" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "propertyType" TEXT NOT NULL,
  "locationLabel" TEXT NOT NULL,
  "price" TEXT NOT NULL,
  "imageUrl" TEXT,
  "contactUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Housing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Job_isActive_createdAt_idx" ON "Job"("isActive", "createdAt");
CREATE INDEX "Job_createdById_createdAt_idx" ON "Job"("createdById", "createdAt");
CREATE INDEX "Housing_isActive_createdAt_idx" ON "Housing"("isActive", "createdAt");
CREATE INDEX "Housing_createdById_createdAt_idx" ON "Housing"("createdById", "createdAt");

ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Housing" ADD CONSTRAINT "Housing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
