-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
