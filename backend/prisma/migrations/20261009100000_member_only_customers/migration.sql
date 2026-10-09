-- Keep every existing customer and their sales/loyalty history, but move all
-- customer accounts to the sole supported account type: Member.
UPDATE "Customer"
SET "customerType" = 'Member'
WHERE "customerType" IS DISTINCT FROM 'Member';

ALTER TABLE "Customer"
ALTER COLUMN "customerType" SET DEFAULT 'Member';

ALTER TABLE "Customer"
ADD CONSTRAINT "Customer_customerType_member_only_check"
CHECK ("customerType" = 'Member');
