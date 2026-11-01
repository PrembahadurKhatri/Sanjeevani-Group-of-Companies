-- CreateTable
CREATE TABLE "CommunityProgram" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "logoId" UUID,
    "photoId" UUID,
    "websiteUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGalleryItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "imageId" UUID,
    "altText" TEXT,
    "text" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityProgram_status_sortOrder_idx" ON "CommunityProgram"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "CommunityGalleryItem_status_sortOrder_idx" ON "CommunityGalleryItem"("status", "sortOrder");

-- AddForeignKey
ALTER TABLE "CommunityProgram" ADD CONSTRAINT "CommunityProgram_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityProgram" ADD CONSTRAINT "CommunityProgram_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGalleryItem" ADD CONSTRAINT "CommunityGalleryItem_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

