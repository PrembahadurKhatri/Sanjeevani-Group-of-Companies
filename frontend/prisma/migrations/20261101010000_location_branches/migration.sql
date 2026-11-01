-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "imageId" UUID,
ADD COLUMN     "websiteUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

