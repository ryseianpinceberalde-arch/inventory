-- Allow custom roles while preserving existing enum role names as text values.
ALTER TABLE "Role" ALTER COLUMN "name" TYPE TEXT USING "name"::TEXT;

-- Mark default roles as system-managed and add permission display metadata.
ALTER TABLE "Role" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Permission" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Permission" ADD COLUMN "module" TEXT NOT NULL DEFAULT '';

UPDATE "Permission"
SET
  "name" = INITCAP(REPLACE(SPLIT_PART("key", '.', 2), '_', ' ')),
  "module" = SPLIT_PART("key", '.', 1)
WHERE "name" = '' OR "module" = '';

UPDATE "Role" SET "isSystem" = true WHERE "name" IN ('ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_STAFF');

CREATE INDEX "Permission_module_idx" ON "Permission"("module");
