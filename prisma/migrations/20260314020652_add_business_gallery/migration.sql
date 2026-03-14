-- AlterTable
ALTER TABLE "public"."Business" ADD COLUMN     "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
