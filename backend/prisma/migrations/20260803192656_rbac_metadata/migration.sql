-- DropIndex
DROP INDEX "Permission_module_idx";

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "module" DROP DEFAULT;
