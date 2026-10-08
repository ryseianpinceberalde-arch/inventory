ALTER TABLE "Product"
ALTER COLUMN "tracksExpiration" SET DEFAULT true;

UPDATE "Product"
SET "tracksExpiration" = true
WHERE "tracksExpiration" = false;
