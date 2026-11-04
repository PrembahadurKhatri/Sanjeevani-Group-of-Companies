DROP INDEX "Company_legacyMongoId_key";
DROP INDEX "JobApplication_legacyMongoId_key";

ALTER TABLE "Company" DROP COLUMN "legacyMongoId";
ALTER TABLE "JobApplication" DROP COLUMN "legacyMongoId";
