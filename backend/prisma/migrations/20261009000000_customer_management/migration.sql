ALTER TABLE "Product"
ADD COLUMN "memberPrice" DECIMAL(12,2),
ADD COLUMN "wholesalePrice" DECIMAL(12,2),
ADD COLUMN "wholesaleMinQuantity" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "Customer"
ALTER COLUMN "customerType" SET DEFAULT 'Regular';

ALTER TABLE "Product"
ADD CONSTRAINT "Product_memberPrice_check" CHECK ("memberPrice" IS NULL OR ("memberPrice" >= 0 AND "memberPrice" <= "sellingPrice")),
ADD CONSTRAINT "Product_wholesalePrice_check" CHECK ("wholesalePrice" IS NULL OR ("wholesalePrice" >= 0 AND "wholesalePrice" <= "sellingPrice")),
ADD CONSTRAINT "Product_wholesaleMinQuantity_check" CHECK ("wholesaleMinQuantity" > 0);

ALTER TABLE "Sale"
ADD COLUMN "loyaltyPointsRedeemed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "loyaltyDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD CONSTRAINT "Sale_loyaltyPointsRedeemed_check" CHECK ("loyaltyPointsRedeemed" >= 0),
ADD CONSTRAINT "Sale_loyaltyDiscount_check" CHECK ("loyaltyDiscount" >= 0);

INSERT INTO "RolePermission" ("id", "roleId", "permissionId")
SELECT gen_random_uuid(), role.id, permission.id
FROM "Role" role
JOIN "Permission" permission ON permission.key = 'customers.view_purchase_history'
WHERE role.name = 'CASHIER'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

CREATE TABLE "LoyaltyTransaction" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "saleId" UUID,
    "refundId" UUID,
    "transactionType" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoyaltyTransaction_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoyaltyTransaction_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "LoyaltyTransaction_saleId_key" ON "LoyaltyTransaction"("saleId");
CREATE UNIQUE INDEX "LoyaltyTransaction_refundId_key" ON "LoyaltyTransaction"("refundId");
CREATE INDEX "LoyaltyTransaction_customerId_createdAt_idx" ON "LoyaltyTransaction"("customerId", "createdAt");

-- Preserve the existing point balances while making recorded sale awards visible in the new history.
INSERT INTO "LoyaltyTransaction" ("id", "customerId", "saleId", "transactionType", "pointsEarned", "pointsRedeemed", "note", "createdAt")
SELECT gen_random_uuid(), sale."customerId", sale.id, 'SALE', sale."loyaltyPointsEarned", 0, 'Imported from existing sale', sale."createdAt"
FROM "Sale" sale
WHERE sale."customerId" IS NOT NULL AND sale."loyaltyPointsEarned" > 0
ON CONFLICT ("saleId") DO NOTHING;

-- Recreate earned-point reversals from historical refund quantities without changing current balances.
WITH refund_quantities AS (
    SELECT refund.id AS "refundId", refund."saleId", refund."createdAt", sale."customerId", sale."loyaltyPointsEarned",
           SUM(refund_item.quantity)::INTEGER AS quantity,
           SUM(SUM(refund_item.quantity)) OVER (PARTITION BY refund."saleId" ORDER BY refund."createdAt", refund.id) AS cumulative_quantity
    FROM "Refund" refund
    JOIN "RefundItem" refund_item ON refund_item."refundId" = refund.id
    JOIN "Sale" sale ON sale.id = refund."saleId"
    WHERE sale."customerId" IS NOT NULL AND sale."loyaltyPointsEarned" > 0
    GROUP BY refund.id, refund."saleId", refund."createdAt", sale."customerId", sale."loyaltyPointsEarned"
), refund_reversals AS (
    SELECT "refundId", "customerId", "createdAt",
           LEAST("loyaltyPointsEarned", cumulative_quantity) - LEAST("loyaltyPointsEarned", cumulative_quantity - quantity) AS points_reversed
    FROM refund_quantities
)
INSERT INTO "LoyaltyTransaction" ("id", "customerId", "refundId", "transactionType", "pointsEarned", "pointsRedeemed", "note", "createdAt")
SELECT gen_random_uuid(), "customerId", "refundId", 'REFUND', -points_reversed, 0, 'Imported from existing refund', "createdAt"
FROM refund_reversals
WHERE points_reversed > 0
ON CONFLICT ("refundId") DO NOTHING;
