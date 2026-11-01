-- CreateEnum
CREATE TYPE "CompanyAchievementKind" AS ENUM ('PROJECT', 'AWARD', 'CERTIFICATION', 'ACHIEVEMENT', 'MILESTONE');

-- CreateEnum
CREATE TYPE "CompanyRelationType" AS ENUM ('SUBSIDIARY', 'BRAND', 'DIVISION', 'ASSOCIATE', 'PARTNER');

-- AlterEnum
ALTER TYPE "LeaderTier" ADD VALUE 'EXECUTIVE';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "background" TEXT,
ADD COLUMN     "coreValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "fullDescription" TEXT,
ADD COLUMN     "headquarters" TEXT,
ADD COLUMN     "history" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "keyFacts" JSONB,
ADD COLUMN     "mapUrl" TEXT,
ADD COLUMN     "officeHours" TEXT,
ADD COLUMN     "philosophy" TEXT,
ADD COLUMN     "profileSections" JSONB,
ADD COLUMN     "registeredAddress" TEXT,
ADD COLUMN     "servicesTitle" TEXT,
ADD COLUMN     "shareImageId" UUID,
ADD COLUMN     "shortName" TEXT;

-- CreateTable
CREATE TABLE "CompanyOffering" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT,
    "imageId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAchievement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "kind" "CompanyAchievementKind" NOT NULL DEFAULT 'PROJECT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "imageId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyRelation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "relatedCompanyId" UUID,
    "relationType" "CompanyRelationType" NOT NULL DEFAULT 'SUBSIDIARY',
    "name" TEXT,
    "description" TEXT,
    "logoId" UUID,
    "websiteUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyOffering_companyId_status_sortOrder_idx" ON "CompanyOffering"("companyId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyOffering_companyId_slug_key" ON "CompanyOffering"("companyId", "slug");

-- CreateIndex
CREATE INDEX "CompanyAchievement_companyId_status_sortOrder_idx" ON "CompanyAchievement"("companyId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "CompanyRelation_companyId_status_sortOrder_idx" ON "CompanyRelation"("companyId", "status", "sortOrder");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_shareImageId_fkey" FOREIGN KEY ("shareImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyOffering" ADD CONSTRAINT "CompanyOffering_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyOffering" ADD CONSTRAINT "CompanyOffering_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAchievement" ADD CONSTRAINT "CompanyAchievement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAchievement" ADD CONSTRAINT "CompanyAchievement_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRelation" ADD CONSTRAINT "CompanyRelation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRelation" ADD CONSTRAINT "CompanyRelation_relatedCompanyId_fkey" FOREIGN KEY ("relatedCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRelation" ADD CONSTRAINT "CompanyRelation_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

