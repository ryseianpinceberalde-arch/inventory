-- DropIndex
DROP INDEX IF EXISTS "Permission_module_idx";

-- Ensure later metadata columns exist before dropping their temporary defaults.
ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "module" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "module" DROP DEFAULT;
