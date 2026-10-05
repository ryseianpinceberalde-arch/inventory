# SmartStock ? All Source Code

This document contains the current local source code and configuration for SmartStock. Each section is labeled with the original file path relative to the repository root.

Includes frontend and backend code, Prisma schema and migrations, the seed script, project configuration, environment templates, and development scripts. Local edits and untracked source files are included.

Excludes actual .env files, installed dependencies, generated build output, logs, uploaded files, package lockfiles, and existing Markdown documentation. The .env.example files contain example configuration only.

This is a snapshot. Later edits to the original files will not automatically update this document.

**Included files: 88**

## File index

- [.gitignore](#source-1)
- [backend/.env.example](#source-2)
- [backend/eslint.config.js](#source-3)
- [backend/package.json](#source-4)
- [backend/prisma/migrations/20260803184222_init/migration.sql](#source-5)
- [backend/prisma/migrations/20260803192656_rbac_metadata/migration.sql](#source-6)
- [backend/prisma/migrations/20260804100000_rbac_metadata/migration.sql](#source-7)
- [backend/prisma/migrations/migration_lock.toml](#source-8)
- [backend/prisma/schema.prisma](#source-9)
- [backend/prisma/seed.ts](#source-10)
- [backend/src/app.ts](#source-11)
- [backend/src/config/env.ts](#source-12)
- [backend/src/config/prisma.ts](#source-13)
- [backend/src/controllers/adminController.ts](#source-14)
- [backend/src/controllers/authController.ts](#source-15)
- [backend/src/controllers/catalogController.ts](#source-16)
- [backend/src/controllers/inventoryController.ts](#source-17)
- [backend/src/controllers/paymongoController.ts](#source-18)
- [backend/src/middleware/auth.ts](#source-19)
- [backend/src/middleware/errorHandler.ts](#source-20)
- [backend/src/middleware/validate.ts](#source-21)
- [backend/src/rbac/permissions.ts](#source-22)
- [backend/src/rbac/serializers.ts](#source-23)
- [backend/src/routes/adminRoutes.ts](#source-24)
- [backend/src/routes/authRoutes.ts](#source-25)
- [backend/src/routes/catalogRoutes.ts](#source-26)
- [backend/src/routes/inventoryRoutes.ts](#source-27)
- [backend/src/routes/paymongoRoutes.ts](#source-28)
- [backend/src/server.ts](#source-29)
- [backend/src/services/auditService.ts](#source-30)
- [backend/src/services/authService.ts](#source-31)
- [backend/src/services/catalogService.ts](#source-32)
- [backend/src/services/inventoryService.ts](#source-33)
- [backend/src/services/paymongoService.ts](#source-34)
- [backend/src/services/reportService.ts](#source-35)
- [backend/src/services/salesService.ts](#source-36)
- [backend/src/services/tokenService.ts](#source-37)
- [backend/src/types/express.d.ts](#source-38)
- [backend/src/utils/AppError.ts](#source-39)
- [backend/src/utils/apiResponse.ts](#source-40)
- [backend/src/utils/asyncHandler.ts](#source-41)
- [backend/src/validators/authValidators.ts](#source-42)
- [backend/src/validators/catalogValidators.ts](#source-43)
- [backend/src/validators/common.ts](#source-44)
- [backend/src/validators/inventoryValidators.ts](#source-45)
- [backend/src/validators/paymongoValidators.ts](#source-46)
- [backend/src/validators/userValidators.ts](#source-47)
- [backend/tsconfig.json](#source-48)
- [frontend/.env.example](#source-49)
- [frontend/eslint.config.js](#source-50)
- [frontend/index.html](#source-51)
- [frontend/package.json](#source-52)
- [frontend/postcss.config.js](#source-53)
- [frontend/public/_redirects](#source-54)
- [frontend/src/App.tsx](#source-55)
- [frontend/src/components/barcode/BarcodeLabel.tsx](#source-56)
- [frontend/src/components/barcode/CameraBarcodeScanner.tsx](#source-57)
- [frontend/src/components/layout/AppLayout.tsx](#source-58)
- [frontend/src/components/rbac/Can.tsx](#source-59)
- [frontend/src/components/ui/Button.tsx](#source-60)
- [frontend/src/components/ui/Card.tsx](#source-61)
- [frontend/src/components/ui/Input.tsx](#source-62)
- [frontend/src/components/ui/Pagination.tsx](#source-63)
- [frontend/src/contexts/AuthContext.tsx](#source-64)
- [frontend/src/index.css](#source-65)
- [frontend/src/lib/format.ts](#source-66)
- [frontend/src/main.tsx](#source-67)
- [frontend/src/pages/AuthUtility.tsx](#source-68)
- [frontend/src/pages/Dashboard.tsx](#source-69)
- [frontend/src/pages/InventoryActions.tsx](#source-70)
- [frontend/src/pages/Login.tsx](#source-71)
- [frontend/src/pages/Notifications.tsx](#source-72)
- [frontend/src/pages/POS.tsx](#source-73)
- [frontend/src/pages/ProfileSettings.tsx](#source-74)
- [frontend/src/pages/Reports.tsx](#source-75)
- [frontend/src/pages/ResourcePage.tsx](#source-76)
- [frontend/src/pages/RoleManagement.tsx](#source-77)
- [frontend/src/pages/Unauthorized.tsx](#source-78)
- [frontend/src/routes/ProtectedRoute.tsx](#source-79)
- [frontend/src/services/api.ts](#source-80)
- [frontend/src/services/reportExporters.ts](#source-81)
- [frontend/src/types/api.ts](#source-82)
- [frontend/src/vite-env.d.ts](#source-83)
- [frontend/tailwind.config.ts](#source-84)
- [frontend/tsconfig.json](#source-85)
- [frontend/vite.config.ts](#source-86)
- [package.json](#source-87)
- [scripts/reset-dev-ports.ps1](#source-88)

<a id="source-1"></a>

## .gitignore

```text
node_modules
dist
.env
.DS_Store
coverage
*.log
backend/uploads/*
!backend/uploads/.gitkeep
backend/prisma/migrations/dev
```

<a id="source-2"></a>

## backend/.env.example

```dotenv
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/smartstock
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIRECTORY=uploads
PAYMONGO_SECRET_KEY=sk_test_replace
PAYMONGO_PUBLIC_KEY=pk_test_replace
```

<a id="source-3"></a>

## backend/eslint.config.js

```javascript
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: "./tsconfig.json" }
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
];
```

<a id="source-4"></a>

## backend/package.json

```json
{
  "name": "smartstock-server",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc && prisma generate",
    "start": "node dist/src/server.js",
    "lint": "eslint \"src/**/*.ts\" prisma/seed.ts",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:validate": "prisma validate",
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcrypt": "^6.0.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "csv-stringify": "^6.5.2",
    "decimal.js": "^10.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "express-rate-limit": "^7.4.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.8.6",
    "@typescript-eslint/eslint-plugin": "^8.13.0",
    "@typescript-eslint/parser": "^8.13.0",
    "eslint": "^9.14.0",
    "prisma": "^5.22.0",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

<a id="source-5"></a>

## backend/prisma/migrations/20260803184222_init/migration.sql

```sql
-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_STAFF');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('STOCK_IN', 'SALE', 'STOCK_OUT', 'CUSTOMER_RETURN', 'SUPPLIER_RETURN', 'ADJUSTMENT', 'DAMAGED', 'EXPIRED', 'CANCELLED_SALE', 'REFUND');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'PENDING', 'HELD', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'GCASH', 'MAYA', 'BANK_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'CUSTOMER_CREDIT', 'MIXED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "primarySupplierId" UUID,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "description" TEXT,
    "costPrice" DECIMAL(12,2) NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "imageUrl" TEXT,
    "tracksExpiration" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdBy" UUID,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBarcode" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductBarcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "paymentTerms" TEXT,
    "deliveryLeadTime" INTEGER,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProduct" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "productId" UUID NOT NULL,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierDelivery" (
    "id" UUID NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "supplierId" UUID NOT NULL,
    "deliveryDate" TIMESTAMPTZ NOT NULL,
    "expectedDate" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "notes" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SupplierDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierDeliveryItem" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "expirationDate" TIMESTAMPTZ,
    "batchNumber" TEXT,

    CONSTRAINT "SupplierDeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierEvaluation" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "onTimeDeliveryPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "correctQuantityPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "productQualityScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "returnRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "averageDeliveryDuration" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "completedDeliveryCount" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "customerType" TEXT NOT NULL DEFAULT 'Walk-in',
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "creditBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "birthday" DATE,
    "notes" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReceipt" (
    "id" UUID NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "supplierId" UUID NOT NULL,
    "receivedById" UUID NOT NULL,
    "deliveryDate" TIMESTAMPTZ NOT NULL,
    "notes" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReceiptItem" (
    "id" UUID NOT NULL,
    "stockReceiptId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "expirationDate" TIMESTAMPTZ,
    "batchNumber" TEXT,

    CONSTRAINT "StockReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "employeeId" UUID,
    "previousQuantity" INTEGER NOT NULL,
    "quantityChanged" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "systemQuantity" INTEGER NOT NULL,
    "physicalQuantity" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "requestedById" UUID NOT NULL,
    "approvedById" UUID,
    "approvalStatus" "AdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" UUID NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "customerId" UUID,
    "cashierId" UUID NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "change" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "idempotencyKey" TEXT,
    "grossProfit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" UUID NOT NULL,
    "saleId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "historicalCost" DECIMAL(12,2) NOT NULL,
    "productDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "profit" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeldSale" (
    "id" UUID NOT NULL,
    "customerId" UUID,
    "cashierId" UUID NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "HeldSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeldSaleItem" (
    "id" UUID NOT NULL,
    "heldSaleId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "HeldSaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "saleId" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "referenceNumber" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "processedById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" UUID NOT NULL,
    "saleId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "refundAmount" DECIMAL(12,2) NOT NULL,
    "refundMethod" "PaymentMethod" NOT NULL,
    "approvedById" UUID,
    "processedById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundItem" (
    "id" UUID NOT NULL,
    "refundId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "RefundItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "recipientRole" "RoleName",
    "relatedProductId" UUID,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "revokedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "usedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_primarySupplierId_idx" ON "Product"("primarySupplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBarcode_code_key" ON "ProductBarcode"("code");

-- CreateIndex
CREATE INDEX "ProductBarcode_code_idx" ON "ProductBarcode"("code");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_supplierId_productId_key" ON "SupplierProduct"("supplierId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierDelivery_referenceNo_key" ON "SupplierDelivery"("referenceNo");

-- CreateIndex
CREATE INDEX "SupplierDelivery_supplierId_idx" ON "SupplierDelivery"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierEvaluation_supplierId_idx" ON "SupplierEvaluation"("supplierId");

-- CreateIndex
CREATE INDEX "Customer_fullName_idx" ON "Customer"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "StockReceipt_referenceNo_key" ON "StockReceipt"("referenceNo");

-- CreateIndex
CREATE INDEX "StockReceipt_supplierId_idx" ON "StockReceipt"("supplierId");

-- CreateIndex
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_employeeId_idx" ON "StockMovement"("employeeId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_referenceNo_idx" ON "StockMovement"("referenceNo");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_receiptNo_key" ON "Sale"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_idempotencyKey_key" ON "Sale"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Sale_receiptNo_idx" ON "Sale"("receiptNo");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Sale_cashierId_idx" ON "Sale"("cashierId");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_saleId_idx" ON "Payment"("saleId");

-- CreateIndex
CREATE INDEX "Notification_recipientRole_isRead_idx" ON "Notification"("recipientRole", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_primarySupplierId_fkey" FOREIGN KEY ("primarySupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDelivery" ADD CONSTRAINT "SupplierDelivery_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDeliveryItem" ADD CONSTRAINT "SupplierDeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "SupplierDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDeliveryItem" ADD CONSTRAINT "SupplierDeliveryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierEvaluation" ADD CONSTRAINT "SupplierEvaluation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceiptItem" ADD CONSTRAINT "StockReceiptItem_stockReceiptId_fkey" FOREIGN KEY ("stockReceiptId") REFERENCES "StockReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceiptItem" ADD CONSTRAINT "StockReceiptItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldSaleItem" ADD CONSTRAINT "HeldSaleItem_heldSaleId_fkey" FOREIGN KEY ("heldSaleId") REFERENCES "HeldSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldSaleItem" ADD CONSTRAINT "HeldSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

<a id="source-6"></a>

## backend/prisma/migrations/20260803192656_rbac_metadata/migration.sql

```sql
-- DropIndex
DROP INDEX IF EXISTS "Permission_module_idx";

-- Ensure later metadata columns exist before dropping their temporary defaults.
ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "module" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "module" DROP DEFAULT;
```

<a id="source-7"></a>

## backend/prisma/migrations/20260804100000_rbac_metadata/migration.sql

```sql
-- Allow custom roles while preserving existing enum role names as text values.
ALTER TABLE "Role" ALTER COLUMN "name" TYPE TEXT USING "name"::TEXT;

-- Mark default roles as system-managed and add permission display metadata.
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "module" TEXT NOT NULL DEFAULT '';

UPDATE "Permission"
SET
  "name" = INITCAP(REPLACE(SPLIT_PART("key", '.', 2), '_', ' ')),
  "module" = SPLIT_PART("key", '.', 1)
WHERE "name" = '' OR "module" = '';

UPDATE "Role" SET "isSystem" = true WHERE "name" IN ('ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_STAFF');

CREATE INDEX IF NOT EXISTS "Permission_module_idx" ON "Permission"("module");
```

<a id="source-8"></a>

## backend/prisma/migrations/migration_lock.toml

```toml
# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "postgresql"
```

<a id="source-9"></a>

## backend/prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RoleName {
  ADMIN
  MANAGER
  CASHIER
  INVENTORY_STAFF
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum ProductStatus {
  ACTIVE
  ARCHIVED
}

enum MovementType {
  STOCK_IN
  SALE
  STOCK_OUT
  CUSTOMER_RETURN
  SUPPLIER_RETURN
  ADJUSTMENT
  DAMAGED
  EXPIRED
  CANCELLED_SALE
  REFUND
}

enum AdjustmentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum SaleStatus {
  COMPLETED
  PENDING
  HELD
  CANCELLED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum PaymentMethod {
  CASH
  GCASH
  MAYA
  BANK_TRANSFER
  DEBIT_CARD
  CREDIT_CARD
  CUSTOMER_CREDIT
  MIXED
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  CRITICAL
}

model Role {
  id              String           @id @default(uuid()) @db.Uuid
  name            String           @unique
  description     String?
  isSystem        Boolean          @default(false)
  users           User[]
  rolePermissions RolePermission[]
  createdAt       DateTime         @default(now()) @db.Timestamptz
  updatedAt       DateTime         @updatedAt @db.Timestamptz
}

model Permission {
  id              String           @id @default(uuid()) @db.Uuid
  key             String           @unique
  name            String
  module          String
  description     String?
  rolePermissions RolePermission[]
  userPermissions UserPermission[]
  createdAt       DateTime         @default(now()) @db.Timestamptz
  updatedAt       DateTime         @updatedAt @db.Timestamptz
}

model RolePermission {
  id           String     @id @default(uuid()) @db.Uuid
  roleId       String     @db.Uuid
  permissionId String     @db.Uuid
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}

model UserPermission {
  id           String     @id @default(uuid()) @db.Uuid
  userId       String     @db.Uuid
  permissionId String     @db.Uuid
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([userId, permissionId])
}

model User {
  id                  String                @id @default(uuid()) @db.Uuid
  roleId              String                @db.Uuid
  fullName            String
  email               String                @unique
  passwordHash        String
  phone               String?
  status              UserStatus            @default(ACTIVE)
  role                Role                  @relation(fields: [roleId], references: [id])
  permissions         UserPermission[]
  refreshTokens       RefreshToken[]
  passwordResetTokens PasswordResetToken[]
  sales               Sale[]                @relation("CashierSales")
  stockReceipts       StockReceipt[]        @relation("ReceivedBy")
  stockMovements      StockMovement[]       @relation("MovementEmployee")
  requestedAdjustments InventoryAdjustment[] @relation("RequestedBy")
  approvedAdjustments InventoryAdjustment[] @relation("ApprovedBy")
  auditLogs           AuditLog[]
  createdAt           DateTime              @default(now()) @db.Timestamptz
  updatedAt           DateTime              @updatedAt @db.Timestamptz

  @@index([roleId])
}

model Category {
  id          String        @id @default(uuid()) @db.Uuid
  name        String        @unique
  description String?
  status      ProductStatus @default(ACTIVE)
  products    Product[]
  createdAt   DateTime      @default(now()) @db.Timestamptz
  updatedAt   DateTime      @updatedAt @db.Timestamptz
}

model Product {
  id                 String              @id @default(uuid()) @db.Uuid
  categoryId         String              @db.Uuid
  primarySupplierId  String?             @db.Uuid
  name               String
  sku                String              @unique
  barcode            String              @unique
  description        String?
  costPrice          Decimal             @db.Decimal(12, 2)
  sellingPrice       Decimal             @db.Decimal(12, 2)
  currentStock       Int                 @default(0)
  reorderLevel       Int                 @default(0)
  unit               String              @default("pcs")
  imageUrl           String?
  tracksExpiration   Boolean             @default(false)
  status             ProductStatus       @default(ACTIVE)
  category           Category            @relation(fields: [categoryId], references: [id])
  primarySupplier    Supplier?           @relation(fields: [primarySupplierId], references: [id])
  barcodes           ProductBarcode[]
  supplierProducts   SupplierProduct[]
  deliveryItems      SupplierDeliveryItem[]
  stockReceiptItems  StockReceiptItem[]
  stockMovements     StockMovement[]
  adjustments        InventoryAdjustment[]
  saleItems          SaleItem[]
  heldSaleItems      HeldSaleItem[]
  refundItems        RefundItem[]
  notifications      Notification[]
  createdAt          DateTime            @default(now()) @db.Timestamptz
  updatedAt          DateTime            @updatedAt @db.Timestamptz
  createdBy          String?             @db.Uuid

  @@index([name])
  @@index([sku])
  @@index([barcode])
  @@index([categoryId])
  @@index([primarySupplierId])
}

model ProductBarcode {
  id        String   @id @default(uuid()) @db.Uuid
  productId String   @db.Uuid
  code      String   @unique
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @db.Timestamptz

  @@index([code])
}

model Supplier {
  id              String             @id @default(uuid()) @db.Uuid
  name            String
  contactPerson   String?
  phone           String?
  email           String?
  address         String?
  paymentTerms    String?
  deliveryLeadTime Int?
  status          ProductStatus      @default(ACTIVE)
  notes           String?
  products        Product[]
  supplierProducts SupplierProduct[]
  deliveries      SupplierDelivery[]
  evaluations     SupplierEvaluation[]
  createdAt       DateTime           @default(now()) @db.Timestamptz
  updatedAt       DateTime           @updatedAt @db.Timestamptz

  @@index([name])
}

model SupplierProduct {
  id         String   @id @default(uuid()) @db.Uuid
  supplierId String   @db.Uuid
  productId  String   @db.Uuid
  supplier   Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([supplierId, productId])
}

model SupplierDelivery {
  id            String                 @id @default(uuid()) @db.Uuid
  referenceNo   String                 @unique
  supplierId    String                 @db.Uuid
  deliveryDate  DateTime               @db.Timestamptz
  expectedDate  DateTime?              @db.Timestamptz
  completedAt   DateTime?              @db.Timestamptz
  notes         String?
  totalAmount   Decimal                @default(0) @db.Decimal(12, 2)
  supplier      Supplier               @relation(fields: [supplierId], references: [id])
  items         SupplierDeliveryItem[]
  createdAt     DateTime               @default(now()) @db.Timestamptz
  updatedAt     DateTime               @updatedAt @db.Timestamptz

  @@index([supplierId])
}

model SupplierDeliveryItem {
  id          String           @id @default(uuid()) @db.Uuid
  deliveryId  String           @db.Uuid
  productId   String           @db.Uuid
  quantity    Int
  unitCost    Decimal          @db.Decimal(12, 2)
  expirationDate DateTime?     @db.Timestamptz
  batchNumber String?
  delivery    SupplierDelivery @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  product     Product          @relation(fields: [productId], references: [id])
}

model SupplierEvaluation {
  id                        String   @id @default(uuid()) @db.Uuid
  supplierId                String   @db.Uuid
  onTimeDeliveryPercentage  Decimal  @default(0) @db.Decimal(5, 2)
  correctQuantityPercentage Decimal  @default(0) @db.Decimal(5, 2)
  productQualityScore       Decimal  @default(0) @db.Decimal(5, 2)
  returnRate                Decimal  @default(0) @db.Decimal(5, 2)
  averageDeliveryDuration   Decimal  @default(0) @db.Decimal(8, 2)
  completedDeliveryCount    Int      @default(0)
  performanceScore          Decimal  @default(0) @db.Decimal(5, 2)
  supplier                  Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  createdAt                 DateTime @default(now()) @db.Timestamptz

  @@index([supplierId])
}

model Customer {
  id             String        @id @default(uuid()) @db.Uuid
  fullName       String
  phone          String?
  email          String?
  address        String?
  customerType   String        @default("Walk-in")
  loyaltyPoints  Int           @default(0)
  creditBalance  Decimal       @default(0) @db.Decimal(12, 2)
  birthday       DateTime?     @db.Date
  notes          String?
  status         ProductStatus @default(ACTIVE)
  sales          Sale[]
  createdAt      DateTime      @default(now()) @db.Timestamptz
  updatedAt      DateTime      @updatedAt @db.Timestamptz

  @@index([fullName])
}

model StockReceipt {
  id          String             @id @default(uuid()) @db.Uuid
  referenceNo String             @unique
  supplierId  String             @db.Uuid
  receivedById String            @db.Uuid
  deliveryDate DateTime          @db.Timestamptz
  notes       String?
  totalAmount Decimal            @default(0) @db.Decimal(12, 2)
  receivedBy  User              @relation("ReceivedBy", fields: [receivedById], references: [id])
  items       StockReceiptItem[]
  createdAt   DateTime          @default(now()) @db.Timestamptz

  @@index([supplierId])
}

model StockReceiptItem {
  id             String       @id @default(uuid()) @db.Uuid
  stockReceiptId String       @db.Uuid
  productId      String       @db.Uuid
  quantity       Int
  unitCost       Decimal      @db.Decimal(12, 2)
  expirationDate DateTime?    @db.Timestamptz
  batchNumber    String?
  stockReceipt   StockReceipt @relation(fields: [stockReceiptId], references: [id], onDelete: Cascade)
  product        Product      @relation(fields: [productId], references: [id])
}

model StockMovement {
  id               String       @id @default(uuid()) @db.Uuid
  productId        String       @db.Uuid
  employeeId       String?      @db.Uuid
  previousQuantity Int
  quantityChanged  Int
  newQuantity      Int
  movementType     MovementType
  referenceNo      String
  reason           String?
  product          Product      @relation(fields: [productId], references: [id])
  employee         User?        @relation("MovementEmployee", fields: [employeeId], references: [id])
  createdAt        DateTime     @default(now()) @db.Timestamptz

  @@index([productId])
  @@index([employeeId])
  @@index([createdAt])
  @@index([referenceNo])
}

model InventoryAdjustment {
  id               String           @id @default(uuid()) @db.Uuid
  productId        String           @db.Uuid
  systemQuantity   Int
  physicalQuantity Int
  difference       Int
  reason           String
  notes            String?
  requestedById    String           @db.Uuid
  approvedById     String?          @db.Uuid
  approvalStatus   AdjustmentStatus @default(PENDING)
  product          Product          @relation(fields: [productId], references: [id])
  requestedBy      User             @relation("RequestedBy", fields: [requestedById], references: [id])
  approvedBy       User?            @relation("ApprovedBy", fields: [approvedById], references: [id])
  createdAt        DateTime         @default(now()) @db.Timestamptz
  updatedAt        DateTime         @updatedAt @db.Timestamptz
}

model Sale {
  id                  String        @id @default(uuid()) @db.Uuid
  receiptNo           String        @unique
  customerId          String?       @db.Uuid
  cashierId           String        @db.Uuid
  subtotal            Decimal       @db.Decimal(12, 2)
  discountTotal       Decimal       @default(0) @db.Decimal(12, 2)
  tax                 Decimal       @default(0) @db.Decimal(12, 2)
  total               Decimal       @db.Decimal(12, 2)
  amountPaid          Decimal       @db.Decimal(12, 2)
  change              Decimal       @db.Decimal(12, 2)
  paymentMethod       PaymentMethod
  status              SaleStatus    @default(COMPLETED)
  idempotencyKey      String?       @unique
  grossProfit         Decimal       @default(0) @db.Decimal(12, 2)
  customer            Customer?     @relation(fields: [customerId], references: [id])
  cashier             User          @relation("CashierSales", fields: [cashierId], references: [id])
  items               SaleItem[]
  payments            Payment[]
  refunds             Refund[]
  createdAt           DateTime      @default(now()) @db.Timestamptz
  updatedAt           DateTime      @updatedAt @db.Timestamptz

  @@index([receiptNo])
  @@index([customerId])
  @@index([cashierId])
  @@index([createdAt])
}

model SaleItem {
  id              String  @id @default(uuid()) @db.Uuid
  saleId          String  @db.Uuid
  productId       String  @db.Uuid
  quantity        Int
  sellingPrice    Decimal @db.Decimal(12, 2)
  historicalCost  Decimal @db.Decimal(12, 2)
  productDiscount Decimal @default(0) @db.Decimal(12, 2)
  lineTotal       Decimal @db.Decimal(12, 2)
  profit          Decimal @db.Decimal(12, 2)
  sale            Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product         Product @relation(fields: [productId], references: [id])
}

model HeldSale {
  id          String         @id @default(uuid()) @db.Uuid
  customerId  String?        @db.Uuid
  cashierId   String         @db.Uuid
  notes       String?
  items       HeldSaleItem[]
  createdAt   DateTime       @default(now()) @db.Timestamptz
  updatedAt   DateTime       @updatedAt @db.Timestamptz
}

model HeldSaleItem {
  id        String   @id @default(uuid()) @db.Uuid
  heldSaleId String  @db.Uuid
  productId String   @db.Uuid
  quantity  Int
  discount  Decimal  @default(0) @db.Decimal(12, 2)
  heldSale  HeldSale @relation(fields: [heldSaleId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])
}

model Payment {
  id              String        @id @default(uuid()) @db.Uuid
  saleId          String        @db.Uuid
  method          PaymentMethod
  referenceNumber String?
  amount          Decimal       @db.Decimal(12, 2)
  processedById   String        @db.Uuid
  sale            Sale          @relation(fields: [saleId], references: [id], onDelete: Cascade)
  createdAt       DateTime      @default(now()) @db.Timestamptz

  @@index([saleId])
}

model Refund {
  id             String        @id @default(uuid()) @db.Uuid
  saleId         String        @db.Uuid
  reason         String
  refundAmount   Decimal       @db.Decimal(12, 2)
  refundMethod   PaymentMethod
  approvedById   String?       @db.Uuid
  processedById  String        @db.Uuid
  sale           Sale          @relation(fields: [saleId], references: [id])
  items          RefundItem[]
  createdAt      DateTime      @default(now()) @db.Timestamptz
}

model RefundItem {
  id          String @id @default(uuid()) @db.Uuid
  refundId    String @db.Uuid
  productId   String @db.Uuid
  quantity    Int
  condition   String
  amount      Decimal @db.Decimal(12, 2)
  refund      Refund  @relation(fields: [refundId], references: [id], onDelete: Cascade)
  product     Product @relation(fields: [productId], references: [id])
}

model Notification {
  id              String               @id @default(uuid()) @db.Uuid
  title           String
  message         String
  alertType       String
  priority        NotificationPriority @default(NORMAL)
  recipientRole   RoleName?
  relatedProductId String?             @db.Uuid
  isRead          Boolean              @default(false)
  product         Product?             @relation(fields: [relatedProductId], references: [id])
  createdAt       DateTime             @default(now()) @db.Timestamptz

  @@index([recipientRole, isRead])
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String?  @db.Uuid
  action    String
  module    String
  recordId  String?
  oldData   Json?
  newData   Json?
  ipAddress String?
  userAgent String?
  user      User?    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now()) @db.Timestamptz
}

model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  tokenHash String   @unique
  expiresAt DateTime @db.Timestamptz
  revokedAt DateTime? @db.Timestamptz
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @db.Timestamptz

  @@index([tokenHash])
}

model PasswordResetToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  tokenHash String   @unique
  expiresAt DateTime @db.Timestamptz
  usedAt    DateTime? @db.Timestamptz
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @db.Timestamptz
}

model SystemSetting {
  id        String   @id @default(uuid()) @db.Uuid
  key       String   @unique
  value     Json
  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz
}
```

<a id="source-10"></a>

## backend/prisma/seed.ts

```typescript
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Prisma, PrismaClient, RoleName } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { defaultRolePermissions, permissionDefinitions } from "../src/rbac/permissions.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const prisma = new PrismaClient({ log: ["error", "warn"] });

function log(message: string) {
  console.log(`[SEED] ${message}`);
}

function getSafeDatabaseLabel() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const parsed = new URL(databaseUrl);
  if (!["postgresql:", "postgres:"].includes(parsed.protocol)) {
    throw new Error("DATABASE_URL must start with postgresql:// or postgres://.");
  }

  return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
}

async function assertSeededData() {
  const [users, roles, permissions, products, categories] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.product.count(),
    prisma.category.count()
  ]);

  log(`Counts: users=${users}, roles=${roles}, permissions=${permissions}, products=${products}, categories=${categories}`);

  const expectedUsers = [
    "admin@smartstock.local",
    "manager@smartstock.local",
    "cashier@smartstock.local",
    "cashier2@smartstock.local",
    "inventory@smartstock.local"
  ];
  const foundUsers = await prisma.user.findMany({
    where: { email: { in: expectedUsers } },
    select: { email: true },
    orderBy: { email: "asc" }
  });
  log(`Users present: ${foundUsers.map((user) => user.email).join(", ")}`);

  if (users === 0 || roles === 0 || permissions === 0 || products === 0 || categories === 0) {
    throw new Error("Seed verification failed: one or more required tables are empty.");
  }

  const missingUsers = expectedUsers.filter((email) => !foundUsers.some((user) => user.email === email));
  if (missingUsers.length > 0) {
    throw new Error(`Seed verification failed: missing users: ${missingUsers.join(", ")}`);
  }
}

async function main() {
  log(`Using database ${getSafeDatabaseLabel()}`);
  await prisma.$connect();
  log("Connected to database");

  log("Creating roles...");
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name },
      update: { description: name.replace("_", " "), isSystem: true },
      create: { name, description: name.replace("_", " "), isSystem: true }
    });
  }

  log("Creating permissions...");
  for (const permission of permissionDefinitions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { name: permission.name, module: permission.module, description: permission.description },
      create: permission
    });
  }

  log("Assigning role permissions...");
  const roles = await prisma.role.findMany();
  const permissionRows = await prisma.permission.findMany();
  for (const role of roles) {
    const keys = defaultRolePermissions[role.name as RoleName];
    if (!keys) continue;
    const rolePermissions = permissionRows.filter((permission) => keys.includes(permission.key));
    for (const permission of rolePermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id }
      });
    }
  }

  log("Creating users...");
  const roleByName = Object.fromEntries(roles.map((role) => [role.name, role.id])) as Record<RoleName, string>;
  const users = [
    ["Admin User", "admin@smartstock.local", "Admin123!", RoleName.ADMIN],
    ["Store Manager", "manager@smartstock.local", "Manager123!", RoleName.MANAGER],
    ["Cashier One", "cashier@smartstock.local", "Cashier123!", RoleName.CASHIER],
    ["Cashier Two", "cashier2@smartstock.local", "Cashier123!", RoleName.CASHIER],
    ["Inventory Staff", "inventory@smartstock.local", "Inventory123!", RoleName.INVENTORY_STAFF]
  ] as const;
  for (const [fullName, email, password, role] of users) {
    await prisma.user.upsert({
      where: { email },
      update: { fullName, roleId: roleByName[role], status: "ACTIVE" },
      create: { fullName, email, passwordHash: await bcrypt.hash(password, 12), roleId: roleByName[role] }
    });
  }

  log("Creating categories...");
  const categories = ["Beverages", "Snacks", "Canned Goods", "Personal Care", "Household"];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name, description: `${name} products` } });
  }
  const categoryRows = await prisma.category.findMany({ where: { name: { in: categories } } });

  log("Creating suppliers...");
  const supplierIds = Array.from({ length: 10 }, (_, index) => `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`);
  for (let i = 1; i <= 10; i += 1) {
    await prisma.supplier.upsert({
      where: { id: supplierIds[i - 1] },
      update: {},
      create: {
        id: supplierIds[i - 1],
        name: `Supplier ${i}`,
        contactPerson: `Contact ${i}`,
        phone: `091700000${String(i).padStart(2, "0")}`,
        email: `supplier${i}@example.com`,
        address: `Metro Manila ${i}`,
        paymentTerms: "Net 30",
        deliveryLeadTime: 3 + (i % 5),
        notes: "Seed supplier"
      }
    });
  }
  const supplierRows = await prisma.supplier.findMany({ where: { id: { in: supplierIds } } });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@smartstock.local" } });
  const cashier = await prisma.user.findUniqueOrThrow({ where: { email: "cashier@smartstock.local" } });

  log("Creating products...");
  for (let i = 1; i <= 30; i += 1) {
    const category = categoryRows[i % categoryRows.length];
    const supplier = supplierRows[i % supplierRows.length];
    const sku = `SKU-${String(i).padStart(4, "0")}`;
    const barcode = `480000000${String(i).padStart(3, "0")}`;
    const product = await prisma.product.upsert({
      where: { sku },
      update: {},
      create: {
        name: `${category.name} Item ${i}`,
        sku,
        barcode,
        categoryId: category.id,
        primarySupplierId: supplier.id,
        description: `Seed product ${i}`,
        costPrice: new Prisma.Decimal(20 + i),
        sellingPrice: new Prisma.Decimal(35 + i),
        currentStock: 20 + i,
        reorderLevel: 10,
        unit: "pcs",
        tracksExpiration: i % 3 === 0,
        createdBy: admin.id
      }
    });
    await prisma.productBarcode.upsert({ where: { code: barcode }, update: {}, create: { productId: product.id, code: barcode } });
    await prisma.supplierProduct.upsert({
      where: { supplierId_productId: { supplierId: supplier.id, productId: product.id } },
      update: {},
      create: { supplierId: supplier.id, productId: product.id }
    });
  }

  log("Creating customers...");
  for (let i = 1; i <= 20; i += 1) {
    await prisma.customer.upsert({
      where: { id: `10000000-0000-0000-0000-${String(i).padStart(12, "0")}` },
      update: {},
      create: {
        id: `10000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
        fullName: i === 1 ? "Walk-in Customer" : `Customer ${i}`,
        phone: `092700000${String(i).padStart(2, "0")}`,
        email: `customer${i}@example.com`,
        customerType: i % 4 === 0 ? "Wholesale" : i % 3 === 0 ? "Member" : "Regular",
        loyaltyPoints: i * 5
      }
    });
  }

  log("Creating supplier deliveries...");
  const products = await prisma.product.findMany({ where: { sku: { startsWith: "SKU-" } }, take: 10, orderBy: { sku: "asc" } });
  const customer = await prisma.customer.findFirstOrThrow({ where: { fullName: "Walk-in Customer" } });
  await prisma.supplierEvaluation.deleteMany({ where: { supplierId: { in: supplierIds } } });
  for (let i = 1; i <= 5; i += 1) {
    const supplier = supplierRows[i % supplierRows.length];
    await prisma.supplierDelivery.upsert({
      where: { referenceNo: `DEL-${String(i).padStart(4, "0")}` },
      update: {},
      create: {
        referenceNo: `DEL-${String(i).padStart(4, "0")}`,
        supplierId: supplier.id,
        deliveryDate: new Date(Date.now() - i * 86400000),
        expectedDate: new Date(Date.now() - (i + 1) * 86400000),
        completedAt: i < 4 ? new Date(Date.now() - i * 86400000) : null,
        totalAmount: 1000 + i * 200,
        items: {
          create: products.slice(0, 3).map((product) => ({
            productId: product.id,
            quantity: 10 + i,
            unitCost: product.costPrice
          }))
        }
      }
    });
    await prisma.supplierEvaluation.create({
      data: {
        supplierId: supplier.id,
        onTimeDeliveryPercentage: 85 + i,
        correctQuantityPercentage: 90,
        productQualityScore: 88,
        returnRate: 2,
        averageDeliveryDuration: 2 + i,
        completedDeliveryCount: i,
        performanceScore: 87 + i
      }
    });
  }

  log("Creating demo sales...");
  await prisma.stockMovement.deleteMany({ where: { referenceNo: { startsWith: "RCP-" }, reason: "Seed sale" } });
  for (let i = 1; i <= 8; i += 1) {
    const product = products[i % products.length];
    const quantity = 1 + (i % 3);
    const lineTotal = product.sellingPrice.mul(quantity);
    const profit = product.sellingPrice.sub(product.costPrice).mul(quantity);
    await prisma.sale.upsert({
      where: { receiptNo: `RCP-${String(i).padStart(5, "0")}` },
      update: {},
      create: {
        receiptNo: `RCP-${String(i).padStart(5, "0")}`,
        customerId: customer.id,
        cashierId: cashier.id,
        subtotal: lineTotal,
        total: lineTotal,
        amountPaid: lineTotal,
        change: 0,
        paymentMethod: i % 2 === 0 ? "GCASH" : "CASH",
        grossProfit: profit,
        idempotencyKey: `seed-sale-${i}`,
        items: {
          create: {
            productId: product.id,
            quantity,
            sellingPrice: product.sellingPrice,
            historicalCost: product.costPrice,
            lineTotal,
            profit
          }
        },
        payments: {
          create: {
            method: i % 2 === 0 ? "GCASH" : "CASH",
            amount: lineTotal,
            processedById: cashier.id
          }
        }
      }
    });
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        employeeId: cashier.id,
        previousQuantity: product.currentStock + quantity,
        quantityChanged: -quantity,
        newQuantity: product.currentStock,
        movementType: "SALE",
        referenceNo: `RCP-${String(i).padStart(5, "0")}`,
        reason: "Seed sale"
      }
    });
  }

  log("Creating notifications...");
  const seedNotificationTitles = ["Low stock sample", "Pending delivery", "Forecast available"];
  await prisma.notification.deleteMany({ where: { title: { in: seedNotificationTitles } } });
  await prisma.notification.createMany({
    data: [
      { title: "Low stock sample", message: "Sample item is below reorder level.", alertType: "LOW_STOCK", priority: "HIGH", recipientRole: "MANAGER" },
      { title: "Pending delivery", message: "Supplier delivery requires review.", alertType: "DELAYED_SUPPLIER_DELIVERY", priority: "NORMAL", recipientRole: "INVENTORY_STAFF" },
      { title: "Forecast available", message: "Three-month moving average forecast was refreshed.", alertType: "FORECAST", priority: "LOW", recipientRole: "MANAGER" }
    ]
  });

  log("Creating system settings...");
  await prisma.systemSetting.upsert({
    where: { key: "business" },
    update: { value: { name: "SmartStock Demo Store", currency: "PHP", symbol: "₱", timezone: "Asia/Manila" } },
    create: { key: "business", value: { name: "SmartStock Demo Store", currency: "PHP", symbol: "₱", timezone: "Asia/Manila" } }
  });

  await assertSeededData();
  log("Seed completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("[SEED] Seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

<a id="source-11"></a>

## backend/src/app.ts

```typescript
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/authRoutes.js";
import { barcodeRoutes, categoryRoutes, customerRoutes, productRoutes, supplierProductRoutes, supplierRoutes } from "./routes/catalogRoutes.js";
import { adjustmentRoutes, heldSaleRoutes, inventoryRoutes, movementRoutes, notificationRoutes, posRoutes, refundRoutes, salesRoutes, stockInRoutes, stockOutRoutes } from "./routes/inventoryRoutes.js";
import { auditRoutes, dashboardRoutes, permissionRoutes, reportRoutes, roleRoutes, settingRoutes, supplierPerformanceRoutes, userRoutes } from "./routes/adminRoutes.js";
import { paymongoRoutes } from "./routes/paymongoRoutes.js";

export const app = express();
const allowedOrigins = new Set([env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"]);

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIRECTORY)));

app.get("/health", (_req, res) => res.json({ success: true, message: "SmartStock API is healthy", data: {}, meta: {} }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/barcodes", barcodeRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/supplier-products", supplierProductRoutes);
app.use("/api/supplier-deliveries", stockInRoutes);
app.use("/api/supplier-performance", supplierPerformanceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/stock-in", stockInRoutes);
app.use("/api/stock-out", stockOutRoutes);
app.use("/api/stock-movements", movementRoutes);
app.use("/api/inventory-adjustments", adjustmentRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/held-sales", heldSaleRoutes);
app.use("/api/payments", salesRoutes);
app.use("/api/paymongo", paymongoRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/settings", settingRoutes);

app.use(notFound);
app.use(errorHandler);
```

<a id="source-12"></a>

## backend/src/config/env.ts

```typescript
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  UPLOAD_DIRECTORY: z.string().default("uploads"),
  UPCITEMDB_API_KEY: z.string().optional(),
  UPCITEMDB_KEY_TYPE: z.string().default("3scale"),
  PAYMONGO_SECRET_KEY: z.string().optional(),
  PAYMONGO_PUBLIC_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
```

<a id="source-13"></a>

## backend/src/config/prisma.ts

```typescript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
});
```

<a id="source-14"></a>

## backend/src/controllers/adminController.ts

```typescript
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { Request, Response } from "express";
import { Prisma, RoleName } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { audit } from "../services/auditService.js";
import { AppError } from "../utils/AppError.js";
import { serializeForPermissions } from "../rbac/serializers.js";
import { buildReport } from "../services/reportService.js";

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  role: true,
  createdAt: true,
  updatedAt: true
};

function isAdminRoleName(name?: string) {
  return name === RoleName.ADMIN;
}

async function ensureCanTouchUser(actor: Express.User | undefined, targetRoleId?: string) {
  if (!actor) throw new AppError("Authentication is required.", 401);
  if (!targetRoleId) return;
  const targetRole = await prisma.role.findUnique({ where: { id: targetRoleId } });
  if (!targetRole) throw new AppError("Role not found", 404);
  if (isAdminRoleName(targetRole.name) && !isAdminRoleName(actor.roleName)) {
    throw new AppError("You do not have permission to perform this action.", 403);
  }
}

function has(permission: string, user?: Express.User) {
  return Boolean(user?.permissions.includes(permission));
}

export const users = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Users loaded", await prisma.user.findMany({ select: userSelect, orderBy: { fullName: "asc" } }));
});

export const user = asyncHandler(async (req: Request, res: Response) => {
  const row = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!row) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, row.role.id);
  return ok(res, "User loaded", row);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  await ensureCanTouchUser(req.user, req.body.roleId);
  const user = await prisma.user.create({
    data: { ...req.body, passwordHash: await bcrypt.hash(req.body.password, 12), password: undefined },
    select: userSelect
  });
  await audit({ userId: req.user?.id, action: "USER_CREATE", module: "USERS", recordId: user.id, newData: user });
  return created(res, "User created", user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!old) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, old.role.id);
  if (req.body.roleId) {
    if (!has("users.assign_role", req.user)) throw new AppError("You do not have permission to perform this action.", 403);
    await ensureCanTouchUser(req.user, req.body.roleId);
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body, select: userSelect });
  await audit({ userId: req.user?.id, action: "USER_UPDATE", module: "USERS", recordId: user.id, oldData: old, newData: user, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "User updated", user);
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = req.body.status;
  if (status !== "ACTIVE" && status !== "INACTIVE") throw new AppError("Invalid user status", 422);
  if (req.params.id === req.user?.id && status === "INACTIVE") throw new AppError("You cannot deactivate your own account.", 409);
  if (status === "ACTIVE" && !has("users.activate", req.user)) throw new AppError("You do not have permission to perform this action.", 403);
  if (status === "INACTIVE" && !has("users.deactivate", req.user)) throw new AppError("You do not have permission to perform this action.", 403);
  const old = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!old) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, old.role.id);
  if (status === "INACTIVE" && isAdminRoleName(old.role.name)) {
    const activeAdmins = await prisma.user.count({ where: { status: "ACTIVE", role: { name: RoleName.ADMIN } } });
    if (activeAdmins <= 1) throw new AppError("The final active Admin cannot be deactivated.", 409);
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status }, select: userSelect });
  await audit({ userId: req.user?.id, action: status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED", module: "USERS", recordId: user.id, oldData: old, newData: user, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "User status updated", user);
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const roleId = req.body.roleId;
  if (typeof roleId !== "string") throw new AppError("roleId is required", 422);
  const old = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!old) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, old.role.id);
  await ensureCanTouchUser(req.user, roleId);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { roleId }, select: userSelect });
  await audit({ userId: req.user?.id, action: "USER_ROLE_CHANGED", module: "USERS", recordId: user.id, oldData: old.role, newData: user.role, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "User role updated", user);
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const password = typeof req.body.password === "string" ? req.body.password : crypto.randomUUID();
  const old = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!old) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, old.role.id);
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  await audit({ userId: req.user?.id, action: "USER_PASSWORD_RESET", module: "USERS", recordId: req.params.id, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Password reset", process.env.NODE_ENV === "development" ? { password } : {});
});

export const roles = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Roles loaded", await prisma.role.findMany({ include: { rolePermissions: { include: { permission: true } }, _count: { select: { users: true } } }, orderBy: { name: "asc" } }));
});

export const role = asyncHandler(async (req: Request, res: Response) => {
  const row = await prisma.role.findUnique({ where: { id: req.params.id }, include: { rolePermissions: { include: { permission: true } }, users: { select: userSelect } } });
  if (!row) throw new AppError("Role not found", 404);
  return ok(res, "Role loaded", row);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (name.length < 2) throw new AppError("Role name is required", 422);
  const role = await prisma.role.create({ data: { name, description: req.body.description, isSystem: false } });
  await audit({ userId: req.user?.id, action: "ROLE_CREATED", module: "ROLES", recordId: role.id, newData: role, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return created(res, "Role created", role);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!old) throw new AppError("Role not found", 404);
  if (old.name === RoleName.ADMIN && !isAdminRoleName(req.user?.roleName)) throw new AppError("You do not have permission to perform this action.", 403);
  const role = await prisma.role.update({ where: { id: req.params.id }, data: { name: req.body.name, description: req.body.description } });
  await audit({ userId: req.user?.id, action: "ROLE_UPDATED", module: "ROLES", recordId: role.id, oldData: old, newData: role, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Role updated", role);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await prisma.role.findUnique({ where: { id: req.params.id }, include: { _count: { select: { users: true } } } });
  if (!role) throw new AppError("Role not found", 404);
  if (role.isSystem) throw new AppError("System roles cannot be deleted.", 409);
  if (role._count.users > 0) throw new AppError("Role still has assigned users.", 409);
  await prisma.role.delete({ where: { id: role.id } });
  await audit({ userId: req.user?.id, action: "ROLE_DELETED", module: "ROLES", recordId: role.id, oldData: role, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Role deleted", {});
});

export const updateRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const keys = Array.isArray(req.body.permissionKeys) ? req.body.permissionKeys : req.body.permissions;
  if (!Array.isArray(keys) || keys.some((key) => typeof key !== "string")) throw new AppError("permissionKeys must be an array", 422);
  const updated = await prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({ where: { id: req.params.id }, include: { rolePermissions: { include: { permission: true } } } });
    if (!role) throw new AppError("Role not found", 404);
    if (role.name === RoleName.ADMIN && !isAdminRoleName(req.user?.roleName)) throw new AppError("You do not have permission to perform this action.", 403);
    const permissions = await tx.permission.findMany({ where: { key: { in: keys } } });
    if (permissions.length !== new Set(keys).size) throw new AppError("One or more permissions are invalid.", 422);
    const currentKeys = new Set(role.rolePermissions.map((row) => row.permission.key));
    const nextKeys = new Set(keys);
    const removed = [...currentKeys].filter((key) => !nextKeys.has(key));
    const added = [...nextKeys].filter((key) => !currentKeys.has(key));
    if (!isAdminRoleName(req.user?.roleName)) {
      const unauthorized = [...added, ...removed].filter((key) => !req.user?.permissions.includes(key));
      if (unauthorized.length > 0) throw new AppError("You cannot assign permissions you do not control.", 403, unauthorized);
    }
    await tx.rolePermission.deleteMany({ where: { roleId: role.id, permission: { key: { in: removed } } } });
    for (const permission of permissions.filter((permission) => added.includes(permission.key))) {
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id }
      });
    }
    await tx.auditLog.create({ data: { userId: req.user?.id, action: "ROLE_PERMISSIONS_UPDATED", module: "ROLES", recordId: role.id, oldData: { permissions: [...currentKeys] }, newData: { permissions: keys }, ipAddress: req.ip, userAgent: req.get("user-agent") } });
    return tx.role.findUniqueOrThrow({ where: { id: role.id }, include: { rolePermissions: { include: { permission: true } }, _count: { select: { users: true } } } });
  });
  return ok(res, "Role permissions updated", updated);
});

export const permissions = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Permissions loaded", await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] }));
});

export const groupedPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] });
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, permission) => {
    acc[permission.module] = acc[permission.module] ?? [];
    acc[permission.module].push(permission);
    return acc;
  }, {});
  return ok(res, "Grouped permissions loaded", grouped);
});

export const auditLogs = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Audit logs loaded", await prisma.auditLog.findMany({ include: { user: { select: userSelect } }, orderBy: { createdAt: "desc" }, take: 300 }));
});

export const settings = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Settings loaded", await prisma.systemSetting.findMany({ orderBy: { key: "asc" } }));
});

export const saveSetting = asyncHandler(async (req: Request, res: Response) => {
  const setting = await prisma.systemSetting.upsert({
    where: { key: req.body.key },
    update: { value: req.body.value },
    create: { key: req.body.key, value: req.body.value }
  });
  await audit({ userId: req.user?.id, action: "SETTINGS_UPDATE", module: "SETTINGS", recordId: setting.id, newData: setting });
  return ok(res, "Setting saved", setting);
});

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startYear = new Date(today.getFullYear(), 0, 1);
  const [sales, products, customers, suppliers, employees, pendingDeliveries, movements] = await Promise.all([
    prisma.sale.findMany({ where: { status: "COMPLETED" }, include: { items: { include: { product: { include: { category: true } } } }, cashier: true, payments: true }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, include: { category: true } }),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.user.count(),
    prisma.supplierDelivery.count({ where: { completedAt: null } }),
    prisma.stockMovement.findMany({ include: { product: true, employee: true }, orderBy: { createdAt: "desc" }, take: 10 })
  ]);
  const sumSales = (from: Date) => sales.filter((sale) => sale.createdAt >= from).reduce((sum, sale) => sum.add(sale.total), new Prisma.Decimal(0));
  const inventoryValue = products.reduce((sum, product) => sum.add(product.costPrice.mul(product.currentStock)), new Prisma.Decimal(0));
  const grossProfit = sales.reduce((sum, sale) => sum.add(sale.grossProfit), new Prisma.Decimal(0));
  const lowStock = products.filter((product) => product.currentStock <= product.reorderLevel);
  const salesByCategory = new Map<string, Prisma.Decimal>();
  const productSales = new Map<string, { id: string; name: string; sku: string; quantitySold: number; revenue: Prisma.Decimal }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const name = item.product.category.name;
      salesByCategory.set(name, (salesByCategory.get(name) ?? new Prisma.Decimal(0)).add(item.lineTotal));
      const current = productSales.get(item.productId) ?? {
        id: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        quantitySold: 0,
        revenue: new Prisma.Decimal(0)
      };
      current.quantitySold += item.quantity;
      current.revenue = current.revenue.add(item.lineTotal);
      productSales.set(item.productId, current);
    }
  }
  const bestSellingProducts = Array.from(productSales.values())
    .sort((a, b) => b.quantitySold - a.quantitySold || Number(b.revenue.sub(a.revenue)))
    .slice(0, 3)
    .map((product) => ({ ...product, revenue: Number(product.revenue) }));
  const dailySales = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    return {
      date: date.toISOString().slice(0, 10),
      sales: sales.filter((sale) => sale.createdAt >= date && sale.createdAt < next).reduce((sum, sale) => sum + Number(sale.total), 0),
      profit: sales.filter((sale) => sale.createdAt >= date && sale.createdAt < next).reduce((sum, sale) => sum + Number(sale.grossProfit), 0)
    };
  });
  return ok(res, "Dashboard loaded", serializeForPermissions({
    summary: {
      todaySales: sumSales(today),
      monthlySales: sumSales(startMonth),
      yearlySales: sumSales(startYear),
      grossSales: sales.reduce((sum, sale) => sum.add(sale.subtotal), new Prisma.Decimal(0)),
      netSales: sales.reduce((sum, sale) => sum.add(sale.total), new Prisma.Decimal(0)),
      grossProfit,
      totalProducts: products.length,
      totalCustomers: customers,
      totalSuppliers: suppliers,
      totalEmployees: employees,
      inventoryValue,
      lowStockProducts: lowStock.length,
      outOfStockProducts: products.filter((product) => product.currentStock === 0).length,
      pendingSupplierDeliveries: pendingDeliveries
    },
    charts: {
      dailySales,
      salesByCategory: Array.from(salesByCategory.entries()).map(([name, value]) => ({ name, value: Number(value) })),
      paymentMethods: Object.values(RoleName).map((name) => ({ name, value: 0 }))
    },
    tables: {
      recentTransactions: sales.slice(0, 10),
      bestSellingProducts,
      lowStockProducts: lowStock.slice(0, 10),
      outOfStockProducts: products.filter((product) => product.currentStock === 0).slice(0, 10),
      recentStockMovements: movements
    }
  }, req.user?.permissions ?? []));
});

export const report = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.type === "profit" && !req.user?.permissions.includes("reports.profit")) {
    throw new AppError("You do not have permission to perform this action.", 403);
  }
  return ok(res, "Report loaded", serializeForPermissions(await buildReport(req.params.type ?? "daily-sales", req.query, req.user?.fullName ?? "System User"), req.user?.permissions ?? []));
});

export const supplierPerformance = asyncHandler(async (req: Request, res: Response) => {
  const suppliers = await prisma.supplier.findMany({ include: { deliveries: true, evaluations: { orderBy: { createdAt: "desc" }, take: 1 } } });
  return ok(res, "Supplier performance loaded", serializeForPermissions(suppliers.map((supplier) => ({
    supplier,
    completedDeliveries: supplier.deliveries.filter((delivery) => delivery.completedAt).length,
    onTimeRate: supplier.evaluations[0]?.onTimeDeliveryPercentage ?? 0,
    performanceScore: supplier.evaluations[0]?.performanceScore ?? 0
  })), req.user?.permissions ?? []));
});
```

<a id="source-15"></a>

## backend/src/controllers/authController.ts

```typescript
import { Request, Response } from "express";
import { ok } from "../utils/apiResponse.js";
import * as auth from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { audit } from "../services/auditService.js";

const refreshCookie = "smartstock_refresh";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await auth.login(req.body.email, req.body.password);
  auth.setRefreshCookie(res, result.refreshToken);
  await audit({ userId: result.user.id, action: "LOGIN", module: "AUTH", ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Login successful", { accessToken: result.accessToken, user: result.user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await auth.refresh(req.cookies?.[refreshCookie]);
  return ok(res, "Access token refreshed", result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await auth.logout(req.cookies?.[refreshCookie]);
  auth.clearRefreshCookie(res);
  return ok(res, "Logout successful", {});
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication is required.", 401);
  return ok(res, "Profile loaded", {
    id: req.user.id,
    fullName: req.user.fullName,
    email: req.user.email,
    role: {
      id: req.user.roleId,
      name: req.user.roleName
    },
    permissions: req.user.permissions
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication is required.", 401);
  await auth.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  await audit({ userId: req.user.id, action: "CHANGE_PASSWORD", module: "AUTH", ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Password changed", {});
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = await auth.createPasswordReset(req.body.email);
  return ok(res, "If the email exists, reset instructions were created", process.env.NODE_ENV === "development" ? { token } : {});
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await auth.resetPassword(req.body.token, req.body.password);
  return ok(res, "Password reset successful", {});
});
```

<a id="source-16"></a>

## backend/src/controllers/catalogController.ts

```typescript
import { Request, Response } from "express";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { audit } from "../services/auditService.js";
import * as catalog from "../services/catalogService.js";
import { serializeForPermissions } from "../rbac/serializers.js";

function parseList(req: Request) {
  return {
    page: Math.max(Number(req.query.page ?? 1), 1),
    limit: Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy : undefined,
    sortOrder: req.query.sortOrder === "asc" ? "asc" as const : "desc" as const
  };
}

function skuPart(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
}

async function generateUniqueSku(name: string, barcode: string) {
  const barcodePart = skuPart(barcode).slice(-12);
  const namePart = skuPart(name).slice(0, 10);
  const baseSku = `SKU-${barcodePart || namePart || Date.now()}`;
  let sku = baseSku;
  let suffix = 2;

  while (await prisma.product.findUnique({ where: { sku } })) {
    sku = `${baseSku}-${suffix}`;
    suffix += 1;
  }

  return sku;
}

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status.toUpperCase() : undefined;
  if (status && status !== "ALL" && status !== ProductStatus.ACTIVE && status !== ProductStatus.ARCHIVED) {
    throw new AppError("Invalid product status filter", 422);
  }
  const result = await catalog.listProducts({
    ...parseList(req),
    categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
    supplierId: typeof req.query.supplierId === "string" ? req.query.supplierId : undefined,
    stockStatus: typeof req.query.stockStatus === "string" ? req.query.stockStatus : undefined,
    status: status as ProductStatus | "ALL" | undefined
  });
  return ok(res, "Products loaded", serializeForPermissions(result.items, req.user?.permissions ?? []), {
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 20),
    total: result.total,
    totalPages: Math.ceil(result.total / Number(req.query.limit ?? 20))
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.product.findFirst({ where: { OR: [{ barcode: req.body.barcode }, { barcodes: { some: { code: req.body.barcode } } }] } });
  if (existing) throw new AppError("This barcode is already assigned to another product.", 409);

  const requestedSku = typeof req.body.sku === "string" ? req.body.sku.trim() : "";
  const sku = requestedSku || await generateUniqueSku(req.body.name, req.body.barcode);
  const existingSku = await prisma.product.findUnique({ where: { sku } });
  if (existingSku) throw new AppError("This SKU is already assigned to another product.", 409);

  const product = await prisma.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: { ...req.body, sku, createdBy: req.user?.id ?? null },
      include: { category: true, primarySupplier: true }
    });
    await tx.productBarcode.create({ data: { productId: createdProduct.id, code: createdProduct.barcode } });
    if (createdProduct.primarySupplierId) {
      await tx.supplierProduct.upsert({
        where: { supplierId_productId: { supplierId: createdProduct.primarySupplierId, productId: createdProduct.id } },
        update: {},
        create: { supplierId: createdProduct.primarySupplierId, productId: createdProduct.id }
      });
    }
    return createdProduct;
  });
  await audit({ userId: req.user?.id, action: "PRODUCT_CREATE", module: "PRODUCTS", recordId: product.id, newData: product });
  return created(res, "Product created", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, primarySupplier: true, barcodes: true, stockMovements: { orderBy: { createdAt: "desc" }, take: 20 } }
  });
  if (!product) throw new AppError("Product not found", 404);
  return ok(res, "Product loaded", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!old) throw new AppError("Product not found", 404);
  const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body, include: { category: true, primarySupplier: true } });
  await audit({ userId: req.user?.id, action: "PRODUCT_UPDATE", module: "PRODUCTS", recordId: product.id, oldData: old, newData: product });
  return ok(res, "Product updated", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const archiveProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await catalog.archiveProduct(req.params.id);
  await audit({ userId: req.user?.id, action: "PRODUCT_ARCHIVE", module: "PRODUCTS", recordId: product.id });
  return ok(res, "Product archived", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const restoreProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await catalog.restoreProduct(req.params.id);
  return ok(res, "Product restored", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const barcodeLookup = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Barcode lookup complete", serializeForPermissions(await catalog.findProductByBarcode(req.params.code), req.user?.permissions ?? []));
});

export const externalBarcodeLookup = asyncHandler(async (req: Request, res: Response) => {
  const result = await catalog.lookupBarcodeOnline(req.params.code);
  if (result.source === "local") {
    return ok(res, "Barcode lookup complete", {
      success: true,
      source: "local",
      exists_locally: true,
      product: serializeForPermissions(result.product, req.user?.permissions ?? [])
    });
  }
  if (result.source === "none") {
    return ok(res, result.message, {
      success: false,
      source: "none",
      exists_locally: false,
      barcode: result.barcode,
      message: result.message
    });
  }
  return ok(res, "Product information found", {
    success: true,
    source: result.source,
    exists_locally: false,
    product: result.product
  });
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const rows = await catalog.categoryMetrics();
  const data = rows.map((category) => {
    const inventoryValue = category.products.reduce((sum, product) => sum.add(product.costPrice.mul(product.currentStock)), new Prisma.Decimal(0));
    const totalSales = category.products.flatMap((product) => product.saleItems).reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0));
    const totalProfit = category.products.flatMap((product) => product.saleItems).reduce((sum, item) => sum.add(item.profit), new Prisma.Decimal(0));
    return { ...category, inventoryValue, totalSales, totalProfit };
  });
  return ok(res, "Categories loaded", serializeForPermissions(data, req.user?.permissions ?? []));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  return created(res, "Category created", await prisma.category.create({ data: req.body }));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Category updated", await prisma.category.update({ where: { id: req.params.id }, data: req.body }));
});

export const listSuppliers = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Suppliers loaded", serializeForPermissions(await prisma.supplier.findMany({ include: { products: true, deliveries: true, evaluations: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { name: "asc" } }), req.user?.permissions ?? []));
});

export const listSupplierProducts = asyncHandler(async (req: Request, res: Response) => {
  const rows = await prisma.supplierProduct.findMany({
    include: { supplier: true, product: { include: { category: true } } },
    orderBy: [{ supplier: { name: "asc" } }, { product: { name: "asc" } }]
  });
  const data = rows.map((row) => ({
    id: row.id,
    supplierId: row.supplierId,
    productId: row.productId,
    supplier: row.supplier.name,
    product: row.product.name,
    sku: row.product.sku,
    barcode: row.product.barcode,
    category: row.product.category.name,
    currentStock: row.product.currentStock,
    costPrice: row.product.costPrice,
    sellingPrice: row.product.sellingPrice,
    status: row.product.status
  }));
  return ok(res, "Supplier products loaded", serializeForPermissions(data, req.user?.permissions ?? []));
});

export const updateSupplierProduct = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.supplierProduct.findUnique({ where: { id: req.params.id }, include: { supplier: true, product: true } });
  if (!old) throw new AppError("Supplier product not found", 404);

  const duplicate = await prisma.supplierProduct.findFirst({
    where: {
      supplierId: req.body.supplierId,
      productId: req.body.productId,
      id: { not: req.params.id }
    }
  });
  if (duplicate) throw new AppError("This supplier product already exists.", 409);

  const row = await prisma.supplierProduct.update({
    where: { id: req.params.id },
    data: { supplierId: req.body.supplierId, productId: req.body.productId },
    include: { supplier: true, product: { include: { category: true } } }
  });
  const data = {
    id: row.id,
    supplierId: row.supplierId,
    productId: row.productId,
    supplier: row.supplier.name,
    product: row.product.name,
    sku: row.product.sku,
    barcode: row.product.barcode,
    category: row.product.category.name,
    currentStock: row.product.currentStock,
    costPrice: row.product.costPrice,
    sellingPrice: row.product.sellingPrice,
    status: row.product.status
  };
  await audit({ userId: req.user?.id, action: "SUPPLIER_PRODUCT_UPDATE", module: "SUPPLIERS", recordId: row.id, oldData: old, newData: row });
  return ok(res, "Supplier product updated", serializeForPermissions(data, req.user?.permissions ?? []));
});

export const getSupplier = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await prisma.supplier.findUnique({ where: { id: req.params.id }, include: { products: true, deliveries: { include: { items: true } }, evaluations: true } });
  if (!supplier) throw new AppError("Supplier not found", 404);
  return ok(res, "Supplier loaded", serializeForPermissions(supplier, req.user?.permissions ?? []));
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  return created(res, "Supplier created", await prisma.supplier.create({ data: req.body }));
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Supplier updated", await prisma.supplier.update({ where: { id: req.params.id }, data: req.body }));
});

export const listCustomers = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Customers loaded", await prisma.customer.findMany({ include: { sales: { take: 5, orderBy: { createdAt: "desc" } } }, orderBy: { fullName: "asc" } }));
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id }, include: { sales: { include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } } } });
  if (!customer) throw new AppError("Customer not found", 404);
  return ok(res, "Customer loaded", serializeForPermissions(customer, req.user?.permissions ?? []));
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  return created(res, "Customer created", await prisma.customer.create({ data: req.body }));
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Customer updated", await prisma.customer.update({ where: { id: req.params.id }, data: req.body }));
});
```

<a id="source-17"></a>

## backend/src/controllers/inventoryController.ts

```typescript
import { Request, Response } from "express";
import { RoleName } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import * as inventory from "../services/inventoryService.js";
import * as sales from "../services/salesService.js";
import { audit } from "../services/auditService.js";
import { serializeForPermissions } from "../rbac/serializers.js";

export const stockIn = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const receipt = await inventory.stockIn({ ...req.body, receivedById: req.user.id });
  await audit({ userId: req.user.id, action: "STOCK_IN", module: "INVENTORY", recordId: receipt.id, newData: receipt });
  return created(res, "Stock-in completed", serializeForPermissions(receipt, req.user.permissions));
});

export const stockOut = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const movement = await inventory.stockOut({ ...req.body, employeeId: req.user.id });
  await audit({ userId: req.user.id, action: "STOCK_OUT", module: "INVENTORY", recordId: movement.id, newData: movement });
  return created(res, "Stock-out completed", serializeForPermissions(movement, req.user.permissions));
});

export const createAdjustment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const adjustment = await inventory.requestAdjustment({ ...req.body, requestedById: req.user.id });
  return created(res, "Inventory adjustment recorded", adjustment);
});

export const heldSales = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  return ok(res, "Held orders loaded", serializeForPermissions(await sales.listHeldSales(req.user.id), req.user.permissions));
});

export const holdSale = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const heldSale = await sales.holdSale({ ...req.body, cashierId: req.user.id });
  await audit({ userId: req.user.id, action: "SALE_HOLD", module: "SALES", recordId: heldSale.id, newData: heldSale });
  return created(res, "Order held", serializeForPermissions(heldSale, req.user.permissions));
});

export const deleteHeldSale = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  await sales.deleteHeldSale(req.params.id, req.user.id);
  await audit({ userId: req.user.id, action: "SALE_RESUME", module: "SALES", recordId: req.params.id });
  return ok(res, "Held order removed", {});
});

export const approveAdjustment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const adjustment = await inventory.approveAdjustment(req.params.id, req.user.id);
  await audit({ userId: req.user.id, action: "INVENTORY_ADJUSTMENT_APPROVED", module: "INVENTORY", recordId: adjustment.id });
  return ok(res, "Inventory adjustment approved", serializeForPermissions(adjustment, req.user.permissions));
});

export const movements = asyncHandler(async (req: Request, res: Response) => {
  const where = {
    productId: typeof req.query.productId === "string" ? req.query.productId : undefined,
    createdAt: typeof req.query.from === "string" || typeof req.query.to === "string"
      ? { gte: typeof req.query.from === "string" ? new Date(req.query.from) : undefined, lte: typeof req.query.to === "string" ? new Date(req.query.to) : undefined }
      : undefined
  };
  return ok(res, "Stock movements loaded", serializeForPermissions(await prisma.stockMovement.findMany({ where, include: { product: true, employee: true }, orderBy: { createdAt: "desc" }, take: 200 }), req.user?.permissions ?? []));
});

export const adjustments = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Adjustments loaded", serializeForPermissions(await prisma.inventoryAdjustment.findMany({ include: { product: true, requestedBy: true, approvedBy: true }, orderBy: { createdAt: "desc" } }), req.user?.permissions ?? []));
});

export const lowStock = asyncHandler(async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({ where: { status: "ACTIVE" }, include: { category: true } });
  return ok(res, "Low stock products loaded", serializeForPermissions(products.filter((product) => product.currentStock <= product.reorderLevel), req.user?.permissions ?? []));
});

export const completeSale = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const sale = await sales.completeSale({ ...req.body, cashierId: req.user.id });
  await audit({ userId: req.user.id, action: "COMPLETED_SALE", module: "SALES", recordId: sale.id, newData: sale });
  return created(res, "Sale completed", serializeForPermissions(sale, req.user.permissions));
});

export const processRefund = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const refund = await sales.processRefund({ ...req.body, processedById: req.user.id });
  await audit({ userId: req.user.id, action: "REFUND", module: "REFUNDS", recordId: refund.id, newData: refund });
  return created(res, "Refund processed", refund);
});

export const salesList = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication is required.", 401);
  const where = req.user.permissions.includes("sales.view_all") ? {} : { cashierId: req.user.id };
  return ok(res, "Sales loaded", serializeForPermissions(await prisma.sale.findMany({ where, include: { customer: true, cashier: true, items: { include: { product: true } }, payments: true }, orderBy: { createdAt: "desc" }, take: 200 }), req.user.permissions));
});

export const saleDetail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication is required.", 401);
  const sale = await prisma.sale.findFirst({ where: { id: req.params.id, ...(req.user.permissions.includes("sales.view_all") ? {} : { cashierId: req.user.id }) }, include: { customer: true, cashier: true, items: { include: { product: true } }, payments: true, refunds: { include: { items: true } } } });
  if (!sale) throw new AppError("Sale not found", 404);
  return ok(res, "Sale loaded", serializeForPermissions(sale, req.user.permissions));
});

export const notifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const role = Object.values(RoleName).includes(req.user.roleName as RoleName) ? req.user.roleName as RoleName : undefined;
  return ok(res, "Notifications loaded", await prisma.notification.findMany({ where: { OR: [{ recipientRole: role }, { recipientRole: null }] }, include: { product: true }, orderBy: { createdAt: "desc" } }));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Notification marked as read", await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } }));
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const role = Object.values(RoleName).includes(req.user.roleName as RoleName) ? req.user.roleName as RoleName : undefined;
  await prisma.notification.updateMany({ where: { recipientRole: role }, data: { isRead: true } });
  return ok(res, "Notifications marked as read", {});
});

export function canApprove(role?: RoleName) {
  return role === RoleName.ADMIN || role === RoleName.MANAGER;
}
```

<a id="source-18"></a>

## backend/src/controllers/paymongoController.ts

```typescript
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import * as paymongo from "../services/paymongoService.js";

export const createGcashCheckout = asyncHandler(async (req: Request, res: Response) => {
  return created(res, "GCash checkout created", await paymongo.createGcashCheckout(req.body));
});

export const checkoutStatus = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "GCash checkout status loaded", await paymongo.getCheckoutStatus(req.params.id));
});
```

<a id="source-19"></a>

## backend/src/middleware/auth.ts

```typescript
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

interface AccessPayload {
  sub: string;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new AppError("Authentication is required.", 401);

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } }
          }
        },
        permissions: { include: { permission: true } }
      }
    });
    if (!user || user.status !== UserStatus.ACTIVE) throw new AppError("Authentication is required.", 401);
    const permissions = new Set<string>([
      ...user.role.rolePermissions.map((row) => row.permission.key),
      ...user.permissions.map((row) => row.permission.key)
    ]);
    req.user = {
      id: user.id,
      role: user.role.name,
      roleId: user.roleId,
      roleName: user.role.name,
      email: user.email,
      fullName: user.fullName,
      permissions: Array.from(permissions)
    };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Authentication is required.", 401));
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Authentication is required.", 401);
    if (!req.user.permissions.includes(permission)) throw new AppError("You do not have permission to perform this action.", 403);
    next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Authentication is required.", 401);
    if (!permissions.some((permission) => req.user?.permissions.includes(permission))) {
      throw new AppError("You do not have permission to perform this action.", 403);
    }
    next();
  };
}

export function requireAllPermissions(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Authentication is required.", 401);
    if (!permissions.every((permission) => req.user?.permissions.includes(permission))) {
      throw new AppError("You do not have permission to perform this action.", 403);
    }
    next();
  };
}

export const authorize = requireAnyPermission;
```

<a id="source-20"></a>

## backend/src/middleware/errorHandler.ts

```typescript
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  void _next;
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: err.issues
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }

  const message = err instanceof Error ? err.message : "Unexpected server error";
  return res.status(500).json({ success: false, message, errors: [] });
}
```

<a id="source-21"></a>

## backend/src/middleware/validate.ts

```typescript
import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}
```

<a id="source-22"></a>

## backend/src/rbac/permissions.ts

```typescript
import { RoleName } from "@prisma/client";

export interface PermissionDefinition {
  key: string;
  name: string;
  module: string;
  description?: string;
}

const keys = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.update",
  "products.archive",
  "products.restore",
  "products.import",
  "products.export",
  "products.view_cost",
  "products.view_profit",
  "categories.view",
  "categories.create",
  "categories.update",
  "categories.archive",
  "barcodes.view",
  "barcodes.generate",
  "barcodes.print",
  "suppliers.view",
  "suppliers.create",
  "suppliers.update",
  "suppliers.archive",
  "suppliers.view_performance",
  "customers.view",
  "customers.create",
  "customers.update",
  "customers.archive",
  "customers.view_purchase_history",
  "inventory.view",
  "inventory.view_value",
  "inventory.stock_in",
  "inventory.stock_out",
  "inventory.adjustment_create",
  "inventory.adjustment_approve",
  "inventory.movement_view",
  "inventory.movement_export",
  "pos.access",
  "sales.create",
  "sales.view_own",
  "sales.view_all",
  "sales.cancel",
  "sales.hold",
  "sales.resume",
  "sales.reprint_receipt",
  "payments.process",
  "payments.view",
  "refunds.create",
  "refunds.approve",
  "refunds.view",
  "reports.daily",
  "reports.monthly",
  "reports.yearly",
  "reports.products",
  "reports.categories",
  "reports.payments",
  "reports.employees",
  "reports.profit",
  "reports.inventory_value",
  "reports.supplier_performance",
  "reports.forecast",
  "reports.export",
  "notifications.view",
  "notifications.manage",
  "users.view",
  "users.create",
  "users.update",
  "users.activate",
  "users.deactivate",
  "users.reset_password",
  "users.assign_role",
  "roles.view",
  "roles.create",
  "roles.update",
  "roles.delete",
  "roles.assign_permissions",
  "audit_logs.view",
  "settings.view",
  "settings.update"
] as const;

function titleFromKey(key: string) {
  const [, action] = key.split(".");
  return action.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const permissionDefinitions: PermissionDefinition[] = keys.map((key) => ({
  key,
  name: titleFromKey(key),
  module: key.split(".")[0],
  description: key
}));

export const allPermissionKeys = permissionDefinitions.map((permission) => permission.key);

export const defaultRolePermissions: Record<RoleName, string[]> = {
  [RoleName.ADMIN]: allPermissionKeys,
  [RoleName.MANAGER]: allPermissionKeys.filter((key) => ![
    "users.create",
    "users.deactivate",
    "users.reset_password",
    "users.assign_role",
    "roles.create",
    "roles.update",
    "roles.delete",
    "roles.assign_permissions",
    "audit_logs.view",
    "settings.update"
  ].includes(key)),
  [RoleName.CASHIER]: [
    "dashboard.view",
    "barcodes.view",
    "customers.view",
    "customers.create",
    "customers.update",
    "pos.access",
    "sales.create",
    "sales.view_own",
    "sales.hold",
    "sales.resume",
    "sales.reprint_receipt",
    "payments.process",
    "payments.view",
    "refunds.create",
    "refunds.view",
    "notifications.view"
  ],
  [RoleName.INVENTORY_STAFF]: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.update",
    "categories.view",
    "barcodes.view",
    "barcodes.generate",
    "barcodes.print",
    "suppliers.view",
    "inventory.view",
    "inventory.stock_in",
    "inventory.stock_out",
    "inventory.adjustment_create",
    "inventory.movement_view",
    "notifications.view"
  ]
};
```

<a id="source-23"></a>

## backend/src/rbac/serializers.ts

```typescript
const productCostFields = new Set(["costPrice", "supplierCost", "historicalCost", "markup", "profit", "grossProfit"]);
const inventoryValueFields = new Set(["inventoryValue", "totalInventoryCost", "expectedSellingValue", "potentialInventoryProfit"]);
const profitFields = new Set(["grossProfit", "netProfit", "profit", "profitMargin", "costOfGoodsSold", "totalProfit"]);

function stripFields(value: unknown, blocked: Set<string>): unknown {
  if (Array.isArray(value)) return value.map((item) => stripFields(item, blocked));
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  if ("toJSON" in value && typeof value.toJSON === "function") return value;
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (!blocked.has(key)) result[key] = stripFields(nested, blocked);
  }
  return result;
}

export function serializeForPermissions<T>(value: T, permissions: string[]): T {
  const blocked = new Set<string>();
  if (!permissions.includes("products.view_cost")) productCostFields.forEach((field) => blocked.add(field));
  if (!permissions.includes("inventory.view_value")) inventoryValueFields.forEach((field) => blocked.add(field));
  if (!permissions.includes("reports.profit")) profitFields.forEach((field) => blocked.add(field));
  if (blocked.size === 0) return value;
  return stripFields(value, blocked) as T;
}
```

<a id="source-24"></a>

## backend/src/routes/adminRoutes.ts

```typescript
import { Router } from "express";
import { authenticate, requireAnyPermission, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/adminController.js";
import { createUserSchema, updateUserSchema } from "../validators/userValidators.js";
import { z } from "zod";

export const userRoutes = Router();
userRoutes.use(authenticate);
userRoutes.get("/", requirePermission("users.view"), controller.users);
userRoutes.post("/", requirePermission("users.create"), validate(createUserSchema), controller.createUser);
userRoutes.get("/:id", requirePermission("users.view"), controller.user);
userRoutes.put("/:id", requirePermission("users.update"), validate(updateUserSchema), controller.updateUser);
userRoutes.patch("/:id", requirePermission("users.update"), validate(updateUserSchema), controller.updateUser);
userRoutes.patch("/:id/status", requireAnyPermission(["users.activate", "users.deactivate"]), controller.updateUserStatus);
userRoutes.patch("/:id/role", requirePermission("users.assign_role"), controller.updateUserRole);
userRoutes.post("/:id/reset-password", requirePermission("users.reset_password"), controller.resetUserPassword);

export const roleRoutes = Router();
roleRoutes.use(authenticate);
roleRoutes.get("/", requirePermission("roles.view"), controller.roles);
roleRoutes.post("/", requirePermission("roles.create"), controller.createRole);
roleRoutes.get("/:id", requirePermission("roles.view"), controller.role);
roleRoutes.patch("/:id", requirePermission("roles.update"), controller.updateRole);
roleRoutes.delete("/:id", requirePermission("roles.delete"), controller.deleteRole);
roleRoutes.put("/:id/permissions", requirePermission("roles.assign_permissions"), controller.updateRolePermissions);

export const permissionRoutes = Router();
permissionRoutes.use(authenticate);
permissionRoutes.get("/", requirePermission("roles.view"), controller.permissions);
permissionRoutes.get("/grouped", requirePermission("roles.view"), controller.groupedPermissions);

export const auditRoutes = Router();
auditRoutes.use(authenticate);
auditRoutes.get("/", requirePermission("audit_logs.view"), controller.auditLogs);

export const settingRoutes = Router();
settingRoutes.use(authenticate);
settingRoutes.get("/", requirePermission("settings.view"), controller.settings);
settingRoutes.post("/", requirePermission("settings.update"), validate(z.object({ key: z.string().min(1), value: z.unknown() })), controller.saveSetting);

export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);
dashboardRoutes.get("/", requirePermission("dashboard.view"), controller.dashboard);

export const reportRoutes = Router();
reportRoutes.use(authenticate);
reportRoutes.get("/:type", requireAnyPermission(["reports.daily", "reports.monthly", "reports.yearly", "reports.products", "reports.categories", "reports.payments", "reports.employees", "reports.profit", "reports.inventory_value", "reports.supplier_performance", "reports.forecast"]), controller.report);

export const supplierPerformanceRoutes = Router();
supplierPerformanceRoutes.use(authenticate);
supplierPerformanceRoutes.get("/", requirePermission("reports.supplier_performance"), controller.supplierPerformance);
```

<a id="source-25"></a>

## backend/src/routes/authRoutes.ts

```typescript
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/authController.js";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema } from "../validators/authValidators.js";

export const authRoutes = Router();

authRoutes.post("/login", validate(loginSchema), controller.login);
authRoutes.post("/refresh", controller.refresh);
authRoutes.post("/logout", controller.logout);
authRoutes.get("/me", authenticate, controller.me);
authRoutes.post("/change-password", authenticate, validate(changePasswordSchema), controller.changePassword);
authRoutes.post("/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);
authRoutes.post("/reset-password", validate(resetPasswordSchema), controller.resetPassword);
```

<a id="source-26"></a>

## backend/src/routes/catalogRoutes.ts

```typescript
import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/catalogController.js";
import { categorySchema, customerSchema, productSchema, supplierProductSchema, supplierSchema } from "../validators/catalogValidators.js";

export const productRoutes = Router();
productRoutes.use(authenticate);
productRoutes.get("/", requirePermission("products.view"), controller.listProducts);
productRoutes.post("/", requirePermission("products.create"), validate(productSchema), controller.createProduct);
productRoutes.get("/barcode/:code", requirePermission("barcodes.view"), controller.barcodeLookup);
productRoutes.get("/:id", requirePermission("products.view"), controller.getProduct);
productRoutes.put("/:id", requirePermission("products.update"), validate(productSchema.partial()), controller.updateProduct);
productRoutes.post("/:id/archive", requirePermission("products.archive"), controller.archiveProduct);
productRoutes.post("/:id/restore", requirePermission("products.restore"), controller.restoreProduct);

export const categoryRoutes = Router();
categoryRoutes.use(authenticate);
categoryRoutes.get("/", requirePermission("categories.view"), controller.listCategories);
categoryRoutes.post("/", requirePermission("categories.create"), validate(categorySchema), controller.createCategory);
categoryRoutes.put("/:id", requirePermission("categories.update"), validate(categorySchema.partial()), controller.updateCategory);

export const barcodeRoutes = Router();
barcodeRoutes.use(authenticate);
barcodeRoutes.get("/lookup/:code", requirePermission("barcodes.view"), controller.externalBarcodeLookup);
barcodeRoutes.get("/:code", requirePermission("barcodes.view"), controller.barcodeLookup);

export const supplierRoutes = Router();
supplierRoutes.use(authenticate);
supplierRoutes.get("/", requirePermission("suppliers.view"), controller.listSuppliers);
supplierRoutes.post("/", requirePermission("suppliers.create"), validate(supplierSchema), controller.createSupplier);
supplierRoutes.get("/:id", requirePermission("suppliers.view"), controller.getSupplier);
supplierRoutes.put("/:id", requirePermission("suppliers.update"), validate(supplierSchema.partial()), controller.updateSupplier);

export const supplierProductRoutes = Router();
supplierProductRoutes.use(authenticate);
supplierProductRoutes.get("/", requirePermission("suppliers.view"), controller.listSupplierProducts);
supplierProductRoutes.put("/:id", requirePermission("suppliers.update"), validate(supplierProductSchema), controller.updateSupplierProduct);

export const customerRoutes = Router();
customerRoutes.use(authenticate);
customerRoutes.get("/", requirePermission("customers.view"), controller.listCustomers);
customerRoutes.post("/", requirePermission("customers.create"), validate(customerSchema), controller.createCustomer);
customerRoutes.get("/:id", requirePermission("customers.view"), controller.getCustomer);
customerRoutes.put("/:id", requirePermission("customers.update"), validate(customerSchema.partial()), controller.updateCustomer);
```

<a id="source-27"></a>

## backend/src/routes/inventoryRoutes.ts

```typescript
import { Router } from "express";
import { authenticate, requireAnyPermission, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/inventoryController.js";
import { adjustmentSchema, heldSaleSchema, refundSchema, saleSchema, stockInSchema, stockOutSchema } from "../validators/inventoryValidators.js";

export const inventoryRoutes = Router();
inventoryRoutes.use(authenticate);
inventoryRoutes.get("/", requirePermission("inventory.view"), controller.lowStock);
inventoryRoutes.get("/low-stock", requirePermission("inventory.view"), controller.lowStock);

export const stockInRoutes = Router();
stockInRoutes.use(authenticate);
stockInRoutes.post("/", requirePermission("inventory.stock_in"), validate(stockInSchema), controller.stockIn);

export const stockOutRoutes = Router();
stockOutRoutes.use(authenticate);
stockOutRoutes.post("/", requirePermission("inventory.stock_out"), validate(stockOutSchema), controller.stockOut);

export const movementRoutes = Router();
movementRoutes.use(authenticate);
movementRoutes.get("/", requirePermission("inventory.movement_view"), controller.movements);

export const adjustmentRoutes = Router();
adjustmentRoutes.use(authenticate);
adjustmentRoutes.get("/", requirePermission("inventory.view"), controller.adjustments);
adjustmentRoutes.post("/", requirePermission("inventory.adjustment_create"), validate(adjustmentSchema), controller.createAdjustment);
adjustmentRoutes.post("/:id/approve", requirePermission("inventory.adjustment_approve"), controller.approveAdjustment);

export const posRoutes = Router();
posRoutes.use(authenticate);
posRoutes.post("/sales", requirePermission("pos.access"), requirePermission("sales.create"), validate(saleSchema), controller.completeSale);
posRoutes.get("/held-sales", requirePermission("pos.access"), requirePermission("sales.resume"), controller.heldSales);
posRoutes.post("/held-sales", requirePermission("pos.access"), requirePermission("sales.hold"), validate(heldSaleSchema), controller.holdSale);
posRoutes.delete("/held-sales/:id", requirePermission("pos.access"), requirePermission("sales.resume"), controller.deleteHeldSale);

export const salesRoutes = Router();
salesRoutes.use(authenticate);
salesRoutes.get("/", requireAnyPermission(["sales.view_all", "sales.view_own"]), controller.salesList);
salesRoutes.post("/", requirePermission("sales.create"), validate(saleSchema), controller.completeSale);
salesRoutes.get("/:id", requireAnyPermission(["sales.view_all", "sales.view_own"]), controller.saleDetail);

export const heldSaleRoutes = Router();
heldSaleRoutes.use(authenticate);
heldSaleRoutes.get("/", requirePermission("sales.resume"), controller.heldSales);
heldSaleRoutes.post("/", requirePermission("sales.hold"), validate(heldSaleSchema), controller.holdSale);
heldSaleRoutes.delete("/:id", requirePermission("sales.resume"), controller.deleteHeldSale);

export const refundRoutes = Router();
refundRoutes.use(authenticate);
refundRoutes.post("/", requirePermission("refunds.create"), validate(refundSchema), controller.processRefund);

export const notificationRoutes = Router();
notificationRoutes.use(authenticate);
notificationRoutes.get("/", requirePermission("notifications.view"), controller.notifications);
notificationRoutes.post("/mark-all-read", requirePermission("notifications.manage"), controller.markAllRead);
notificationRoutes.post("/:id/read", requirePermission("notifications.view"), controller.markNotificationRead);
```

<a id="source-28"></a>

## backend/src/routes/paymongoRoutes.ts

```typescript
import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/paymongoController.js";
import { gcashCheckoutSchema } from "../validators/paymongoValidators.js";

export const paymongoRoutes = Router();
paymongoRoutes.use(authenticate);
paymongoRoutes.post("/gcash-checkout", requirePermission("payments.process"), validate(gcashCheckoutSchema), controller.createGcashCheckout);
paymongoRoutes.get("/checkout-sessions/:id", requirePermission("payments.view"), controller.checkoutStatus);
```

<a id="source-29"></a>

## backend/src/server.ts

```typescript
import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`SmartStock API listening on http://localhost:${env.PORT}`);
});
```

<a id="source-30"></a>

## backend/src/services/auditService.ts

```typescript
import { prisma } from "../config/prisma.js";

export async function audit(input: {
  userId?: string;
  action: string;
  module: string;
  recordId?: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      module: input.module,
      recordId: input.recordId,
      oldData: input.oldData === undefined ? undefined : JSON.parse(JSON.stringify(input.oldData)),
      newData: input.newData === undefined ? undefined : JSON.parse(JSON.stringify(input.newData)),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
}
```

<a id="source-31"></a>

## backend/src/services/authService.ts

```typescript
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Response } from "express";
import { UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { findRefreshToken, persistRefreshToken, signAccessToken, signRefreshToken } from "./tokenService.js";

const cookieName = "smartstock_refresh";

export function setRefreshCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(cookieName);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { role: { include: { rolePermissions: { include: { permission: true } } } }, permissions: { include: { permission: true } } } });
  if (!user || user.status !== UserStatus.ACTIVE) throw new AppError("Invalid credentials", 401);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid credentials", 401);

  const publicUser = {
    id: user.id,
    role: user.role.name,
    roleId: user.roleId,
    roleName: user.role.name,
    email: user.email,
    fullName: user.fullName,
    permissions: Array.from(new Set([
      ...user.role.rolePermissions.map((row) => row.permission.key),
      ...user.permissions.map((row) => row.permission.key)
    ]))
  };
  const accessToken = signAccessToken(publicUser);
  const refreshToken = signRefreshToken(user.id);
  await persistRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken, user: publicUser };
}

export async function refresh(rawToken?: string) {
  if (!rawToken) throw new AppError("Refresh token required", 401);
  const stored = await findRefreshToken(rawToken);
  if (!stored || stored.user.status !== UserStatus.ACTIVE) throw new AppError("Invalid refresh token", 401);
  const publicUser = {
    id: stored.user.id,
    role: stored.user.role.name,
    roleId: stored.user.roleId,
    roleName: stored.user.role.name,
    email: stored.user.email,
    fullName: stored.user.fullName,
    permissions: stored.user.role.rolePermissions.map((row) => row.permission.key)
  };
  return { accessToken: signAccessToken(publicUser), user: publicUser };
}

export async function logout(rawToken?: string) {
  if (!rawToken) return;
  const stored = await findRefreshToken(rawToken);
  if (stored) await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError("Current password is incorrect", 400);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
}

export async function createPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(token, 10),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const active = await prisma.passwordResetToken.findMany({
    where: { usedAt: null, expiresAt: { gt: new Date() } }
  });
  for (const row of active) {
    if (await bcrypt.compare(token, row.tokenHash)) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } }),
        prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } })
      ]);
      return;
    }
  }
  throw new AppError("Invalid or expired reset token", 400);
}
```

<a id="source-32"></a>

## backend/src/services/catalogService.ts

```typescript
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export interface ListParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder: "asc" | "desc";
}

function paging(params: ListParams) {
  return { skip: (params.page - 1) * params.limit, take: params.limit };
}

export async function listProducts(params: ListParams & { categoryId?: string; supplierId?: string; stockStatus?: string; status?: ProductStatus | "ALL" }) {
  const where: Prisma.ProductWhereInput = {
    status: params.status === "ALL" ? undefined : params.status ?? ProductStatus.ACTIVE,
    categoryId: params.categoryId,
    primarySupplierId: params.supplierId,
    OR: params.search
      ? [
          { name: { contains: params.search, mode: "insensitive" } },
          { sku: { contains: params.search, mode: "insensitive" } },
          { barcode: { contains: params.search, mode: "insensitive" } }
        ]
      : undefined
  };
  if (params.stockStatus === "low") where.currentStock = { lte: prisma.product.fields.reorderLevel };
  if (params.stockStatus === "out") where.currentStock = 0;
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      ...paging(params),
      include: { category: true, primarySupplier: true },
      orderBy: { [params.sortBy ?? "updatedAt"]: params.sortOrder }
    }),
    prisma.product.count({ where })
  ]);
  return { items, total };
}

export async function findProductByBarcode(code: string) {
  const product = await prisma.product.findFirst({
    where: {
      status: ProductStatus.ACTIVE,
      OR: [{ barcode: code }, { barcodes: { some: { code } } }]
    },
    include: { category: true, primarySupplier: true }
  });
  if (!product) throw new AppError("Barcode is not registered", 404);
  return product;
}

export interface ExternalProductDraft {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  image?: string;
  manufacturer?: string;
  size?: string;
  source: "upcitemdb" | "openfoodfacts";
  importedFields: string[];
}

export type BarcodeLookupResult =
  | { source: "local"; existsLocally: true; product: Awaited<ReturnType<typeof findProductByBarcode>> }
  | { source: "upcitemdb" | "openfoodfacts"; existsLocally: false; product: ExternalProductDraft }
  | { source: "none"; existsLocally: false; barcode: string; message: string };

interface UpcItemDbItem {
  ean?: unknown;
  upc?: unknown;
  title?: unknown;
  brand?: unknown;
  category?: unknown;
  description?: unknown;
  images?: unknown;
  manufacturer?: unknown;
  size?: unknown;
}

interface UpcItemDbResponse {
  total?: unknown;
  items?: unknown;
}

interface OpenFoodFactsResponse {
  status?: unknown;
  product?: unknown;
}

const lookupCache = new Map<string, { expiresAt: number; result: BarcodeLookupResult }>();
const cacheTtlMs = 24 * 60 * 60 * 1000;

export function normalizeBarcode(rawCode: string) {
  const code = rawCode.trim().replace(/[^A-Za-z0-9._-]/g, "");
  if (!code) throw new AppError("Barcode is required", 422);
  if (code.length < 3 || code.length > 64) throw new AppError("Barcode must be between 3 and 64 supported characters", 422);
  return code;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstImage(value: unknown) {
  if (!Array.isArray(value)) return "";
  const image = value.find((item) => typeof item === "string" && item.trim().startsWith("http"));
  return typeof image === "string" ? image.trim() : "";
}

function importedFields(product: Omit<ExternalProductDraft, "source" | "importedFields">) {
  return Object.entries(product)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key]) => key);
}

async function fetchJson(url: string, headers: HeadersInit = {}) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(7000)
  });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

async function lookupUpcItemDb(barcode: string): Promise<ExternalProductDraft | null> {
  const headers: HeadersInit = {};
  const endpoint = env.UPCITEMDB_API_KEY ? "https://api.upcitemdb.com/prod/v1/lookup" : "https://api.upcitemdb.com/prod/trial/lookup";
  if (env.UPCITEMDB_API_KEY) {
    headers.user_key = env.UPCITEMDB_API_KEY;
    headers.key_type = env.UPCITEMDB_KEY_TYPE;
  }

  const payload = await fetchJson(`${endpoint}?upc=${encodeURIComponent(barcode)}`, headers) as UpcItemDbResponse | null;
  if (!payload || typeof payload.total !== "number" || payload.total < 1 || !Array.isArray(payload.items)) return null;
  const item = payload.items[0] as UpcItemDbItem | undefined;
  if (!item) return null;

  const product = {
    barcode: stringValue(item.ean) || stringValue(item.upc) || barcode,
    name: stringValue(item.title),
    brand: stringValue(item.brand) || undefined,
    category: stringValue(item.category) || undefined,
    description: stringValue(item.description) || undefined,
    image: firstImage(item.images) || undefined,
    manufacturer: stringValue(item.manufacturer) || undefined,
    size: stringValue(item.size) || undefined
  };
  if (!product.name) return null;
  return { ...product, barcode, source: "upcitemdb", importedFields: importedFields(product) };
}

async function lookupOpenFoodFacts(barcode: string): Promise<ExternalProductDraft | null> {
  const payload = await fetchJson(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`) as OpenFoodFactsResponse | null;
  if (!payload || payload.status !== 1 || !payload.product || typeof payload.product !== "object") return null;
  const productData = payload.product as Record<string, unknown>;
  const name = stringValue(productData.product_name) || stringValue(productData.generic_name);
  if (!name) return null;
  const product = {
    barcode,
    name,
    brand: stringValue(productData.brands) || undefined,
    category: stringValue(productData.categories) || undefined,
    description: stringValue(productData.generic_name) || undefined,
    image: stringValue(productData.image_front_url) || stringValue(productData.image_url) || undefined,
    manufacturer: stringValue(productData.manufacturing_places) || undefined,
    size: stringValue(productData.quantity) || undefined
  };
  return { ...product, source: "openfoodfacts", importedFields: importedFields(product) };
}

export async function lookupBarcodeOnline(rawCode: string): Promise<BarcodeLookupResult> {
  const barcode = normalizeBarcode(rawCode);

  const localProduct = await prisma.product.findFirst({
    where: { OR: [{ barcode }, { barcodes: { some: { code: barcode } } }] },
    include: { category: true, primarySupplier: true }
  });
  if (localProduct) return { source: "local", existsLocally: true, product: localProduct };

  const cached = lookupCache.get(barcode);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  let result: BarcodeLookupResult = { source: "none", existsLocally: false, barcode, message: "Product not found" };
  try {
    const upcItem = await lookupUpcItemDb(barcode);
    if (upcItem) result = { source: "upcitemdb", existsLocally: false, product: upcItem };
    else {
      const foodItem = await lookupOpenFoodFacts(barcode);
      if (foodItem) result = { source: "openfoodfacts", existsLocally: false, product: foodItem };
    }
  } catch {
    result = { source: "none", existsLocally: false, barcode, message: "Online product lookup is currently unavailable. You can still add this product manually." };
  }

  lookupCache.set(barcode, { expiresAt: Date.now() + cacheTtlMs, result });
  return result;
}

export async function archiveProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: { saleItems: true, stockMovements: true } });
  if (!product) throw new AppError("Product not found", 404);
  return prisma.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED } });
}

export async function restoreProduct(id: string) {
  return prisma.product.update({ where: { id }, data: { status: ProductStatus.ACTIVE } });
}

export async function categoryMetrics() {
  return prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      products: { select: { currentStock: true, costPrice: true, sellingPrice: true, saleItems: { select: { lineTotal: true, profit: true } } } }
    },
    orderBy: { name: "asc" }
  });
}
```

<a id="source-33"></a>

## backend/src/services/inventoryService.ts

```typescript
import { MovementType, NotificationPriority, Prisma, RoleName } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function createLowStockAlert(tx: Prisma.TransactionClient, productId: string) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) return;
  if (product.currentStock <= product.reorderLevel) {
    await tx.notification.create({
      data: {
        title: product.currentStock === 0 ? "Product is out of stock" : "Product is low on stock",
        message: `${product.name} has ${product.currentStock} ${product.unit} remaining.`,
        alertType: product.currentStock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
        priority: product.currentStock === 0 ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
        recipientRole: RoleName.MANAGER,
        relatedProductId: product.id
      }
    });
  }
}

export async function stockIn(input: {
  referenceNo: string;
  supplierId: string;
  deliveryDate: string;
  notes?: string;
  receivedById: string;
  items: { productId: string; quantity: number; unitCost: string; expirationDate?: string | null; batchNumber?: string }[];
}) {
  return prisma.$transaction(async (tx) => {
    const totalAmount = input.items.reduce((sum, item) => sum.add(new Prisma.Decimal(item.unitCost).mul(item.quantity)), new Prisma.Decimal(0));
    const receipt = await tx.stockReceipt.create({
      data: {
        referenceNo: input.referenceNo,
        supplierId: input.supplierId,
        receivedById: input.receivedById,
        deliveryDate: new Date(input.deliveryDate),
        notes: input.notes,
        totalAmount,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
            batchNumber: item.batchNumber
          }))
        }
      },
      include: { items: true }
    });

    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new AppError("Product not found", 404);
      const newQuantity = product.currentStock + item.quantity;
      await tx.product.update({ where: { id: item.productId }, data: { currentStock: newQuantity, costPrice: item.unitCost } });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          employeeId: input.receivedById,
          previousQuantity: product.currentStock,
          quantityChanged: item.quantity,
          newQuantity,
          movementType: MovementType.STOCK_IN,
          referenceNo: input.referenceNo,
          reason: "Supplier delivery"
        }
      });
    }
    return receipt;
  });
}

export async function stockOut(input: {
  referenceNo: string;
  productId: string;
  quantity: number;
  reason: string;
  notes?: string;
  employeeId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new AppError("Product not found", 404);
    if (product.currentStock < input.quantity) throw new AppError("Insufficient stock", 400);
    const newQuantity = product.currentStock - input.quantity;
    await tx.product.update({ where: { id: product.id }, data: { currentStock: newQuantity } });
    const movement = await tx.stockMovement.create({
      data: {
        productId: product.id,
        employeeId: input.employeeId,
        previousQuantity: product.currentStock,
        quantityChanged: -input.quantity,
        newQuantity,
        movementType: MovementType.STOCK_OUT,
        referenceNo: input.referenceNo,
        reason: `${input.reason}${input.notes ? ` - ${input.notes}` : ""}`
      }
    });
    if (input.quantity >= Math.max(product.reorderLevel * 2, 20)) {
      await tx.notification.create({
        data: {
          title: "Large stock-out recorded",
          message: `${input.quantity} units were removed from ${product.name}.`,
          alertType: "LARGE_STOCK_OUT",
          priority: NotificationPriority.HIGH,
          recipientRole: RoleName.MANAGER,
          relatedProductId: product.id
        }
      });
    }
    await createLowStockAlert(tx, product.id);
    return movement;
  });
}

export async function requestAdjustment(input: {
  productId: string;
  physicalQuantity: number;
  reason: string;
  notes?: string;
  requestedById: string;
}) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new AppError("Product not found", 404);
  const difference = input.physicalQuantity - product.currentStock;
  return prisma.inventoryAdjustment.create({
    data: {
      productId: product.id,
      systemQuantity: product.currentStock,
      physicalQuantity: input.physicalQuantity,
      difference,
      reason: input.reason,
      notes: input.notes,
      requestedById: input.requestedById,
      approvalStatus: Math.abs(difference) >= 10 ? "PENDING" : "APPROVED",
      approvedById: Math.abs(difference) >= 10 ? null : input.requestedById
    }
  });
}

export async function approveAdjustment(id: string, approvedById: string) {
  return prisma.$transaction(async (tx) => {
    const adjustment = await tx.inventoryAdjustment.findUnique({ where: { id }, include: { product: true } });
    if (!adjustment) throw new AppError("Adjustment not found", 404);
    if (adjustment.approvalStatus !== "PENDING") return adjustment;
    if (adjustment.requestedById === approvedById) throw new AppError("You cannot approve your own adjustment request.", 409);
    await tx.product.update({ where: { id: adjustment.productId }, data: { currentStock: adjustment.physicalQuantity } });
    await tx.stockMovement.create({
      data: {
        productId: adjustment.productId,
        employeeId: approvedById,
        previousQuantity: adjustment.systemQuantity,
        quantityChanged: adjustment.difference,
        newQuantity: adjustment.physicalQuantity,
        movementType: MovementType.ADJUSTMENT,
        referenceNo: `ADJ-${adjustment.id}`,
        reason: adjustment.reason
      }
    });
    await createLowStockAlert(tx, adjustment.productId);
    return tx.inventoryAdjustment.update({ where: { id }, data: { approvalStatus: "APPROVED", approvedById } });
  });
}
```

<a id="source-34"></a>

## backend/src/services/paymongoService.ts

```typescript
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const paymongoBaseUrl = "https://api.paymongo.com/v1";

interface PayMongoCheckoutResponse {
  data: {
    id: string;
    attributes: {
      checkout_url: string;
      status: string;
      payment_intent?: {
        attributes?: {
          status?: string;
        };
      };
      payments?: Array<{
        attributes?: {
          status?: string;
        };
      }>;
    };
  };
}

function authHeader() {
  if (!env.PAYMONGO_SECRET_KEY) throw new AppError("PayMongo secret key is not configured.", 500);
  return `Basic ${Buffer.from(`${env.PAYMONGO_SECRET_KEY}:`).toString("base64")}`;
}

function centavos(value: Prisma.Decimal | number) {
  return Math.round(Number(value) * 100);
}

function allowedRedirectUrl(url: string) {
  const parsed = new URL(url);
  const allowed = [new URL(env.CLIENT_URL), new URL("http://localhost:5173"), new URL("http://127.0.0.1:5173")];
  if (!allowed.some((origin) => origin.origin === parsed.origin)) throw new AppError("Invalid PayMongo redirect URL.", 422);
  return parsed.toString();
}

async function paymongo<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${paymongoBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.errors?.[0]?.detail === "string" ? payload.errors[0].detail : "PayMongo request failed.";
    throw new AppError(message, response.status);
  }
  return payload as T;
}

export async function createGcashCheckout(input: {
  items: { productId: string; quantity: number; productDiscount: string }[];
  successUrl: string;
  cancelUrl: string;
}) {
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((item) => item.productId) }, status: "ACTIVE" },
    include: { category: true }
  });
  const productsById = new Map(products.map((product) => [product.id, product]));
  let total = new Prisma.Decimal(0);
  const lineItems = input.items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) throw new AppError("Product not found", 404);
    if (product.currentStock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);
    const discount = new Prisma.Decimal(item.productDiscount);
    const lineTotal = product.sellingPrice.mul(item.quantity).sub(discount);
    total = total.add(lineTotal);
    return {
      name: product.name,
      description: product.category.name,
      amount: centavos(lineTotal.div(item.quantity)),
      currency: "PHP",
      quantity: item.quantity
    };
  });

  if (total.lte(0)) throw new AppError("Checkout total must be greater than zero.", 422);

  const referenceNumber = `PM-${Date.now()}`;
  const checkout = await paymongo<PayMongoCheckoutResponse>("/checkout_sessions", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          billing: { name: "POS Customer", email: "customer@example.com" },
          description: `SmartStock POS ${referenceNumber}`,
          line_items: lineItems,
          payment_method_types: ["gcash"],
          reference_number: referenceNumber,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          success_url: allowedRedirectUrl(input.successUrl),
          cancel_url: allowedRedirectUrl(input.cancelUrl),
          metadata: { source: "smartstock-pos", referenceNumber }
        }
      }
    })
  });

  return {
    id: checkout.data.id,
    checkoutUrl: checkout.data.attributes.checkout_url,
    referenceNumber,
    amount: Number(total.toFixed(2))
  };
}

export async function getCheckoutStatus(id: string) {
  const checkout = await paymongo<PayMongoCheckoutResponse>(`/checkout_sessions/${encodeURIComponent(id)}`);
  const payments = checkout.data.attributes.payments ?? [];
  const paid = checkout.data.attributes.payment_intent?.attributes?.status === "succeeded" || payments.some((payment) => payment.attributes?.status === "paid");
  return {
    id: checkout.data.id,
    status: checkout.data.attributes.status,
    paid
  };
}
```

<a id="source-35"></a>

## backend/src/services/reportService.ts

```typescript
import { PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

type CellValue = string | number;
type ValueKind = "text" | "number" | "currency" | "percent" | "date" | "datetime" | "time";

export interface ReportColumn {
  key: string;
  label: string;
  type?: ValueKind;
}

export interface ReportSection {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, CellValue>[];
}

export interface ReportPayload {
  report: string;
  title: string;
  period: string;
  generatedAt: Date;
  generatedBy: string;
  business: { name: string; address: string; contactNumber: string; email: string; logoUrl?: string };
  summary: Array<{ label: string; value: CellValue; type?: ValueKind }>;
  columns: ReportColumn[];
  rows: Record<string, CellValue>[];
  sections: ReportSection[];
}

function number(value: Prisma.Decimal | number | string | null | undefined) {
  return Number(value ?? 0);
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function margin(profit: number, sales: number) {
  return sales === 0 ? 0 : round((profit / sales) * 100);
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function defaultPeriod(type: string) {
  const today = startOfDay(new Date());
  if (type === "monthly-sales") return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: addDays(new Date(today.getFullYear(), today.getMonth() + 1, 1), -1) };
  if (type === "yearly-sales") return { from: new Date(today.getFullYear(), 0, 1), to: new Date(today.getFullYear(), 11, 31) };
  if (type === "daily-sales") return { from: today, to: today };
  return { from: undefined, to: undefined };
}

function parsePeriod(query: Record<string, unknown>, type: string) {
  const fallback = defaultPeriod(type);
  const from = typeof query.from === "string" ? startOfDay(new Date(query.from)) : fallback.from;
  const toBase = typeof query.to === "string" ? startOfDay(new Date(query.to)) : fallback.to;
  return { from, to: toBase ? addDays(toBase, 1) : undefined, labelTo: toBase };
}

function inPeriod<T extends { createdAt: Date }>(rows: T[], from?: Date, to?: Date) {
  return rows.filter((row) => (!from || row.createdAt >= from) && (!to || row.createdAt < to));
}

function filterSales(sales: Awaited<ReturnType<typeof baseSales>>, query: Record<string, unknown>) {
  return sales.filter((sale) => {
    if (typeof query.employeeId === "string" && sale.cashierId !== query.employeeId) return false;
    if (typeof query.paymentMethod === "string" && sale.paymentMethod !== query.paymentMethod) return false;
    if (typeof query.productId === "string" && !sale.items.some((item) => item.productId === query.productId)) return false;
    if (typeof query.categoryId === "string" && !sale.items.some((item) => item.product.categoryId === query.categoryId)) return false;
    if (typeof query.supplierId === "string" && !sale.items.some((item) => item.product.primarySupplierId === query.supplierId)) return false;
    return true;
  });
}

function periodLabel(from?: Date, labelTo?: Date) {
  if (!from && !labelTo) return "All Time";
  const start = from ? dateKey(from) : "Beginning";
  const end = labelTo ? dateKey(labelTo) : "Present";
  return start === end ? start : `${start} to ${end}`;
}

async function business() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "business" } });
  const value = setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value) ? setting.value as Record<string, unknown> : {};
  return {
    name: typeof value.name === "string" ? value.name : "SmartStock",
    address: typeof value.address === "string" ? value.address : "",
    contactNumber: typeof value.contactNumber === "string" ? value.contactNumber : "",
    email: typeof value.email === "string" ? value.email : "",
    logoUrl: typeof value.logoUrl === "string" ? value.logoUrl : undefined
  };
}

const transactionColumns: ReportColumn[] = [
  { key: "invoice", label: "Invoice Number" },
  { key: "date", label: "Date", type: "date" },
  { key: "time", label: "Time", type: "time" },
  { key: "cashier", label: "Cashier" },
  { key: "itemsSold", label: "Items Sold", type: "number" },
  { key: "grossSales", label: "Gross Sales", type: "currency" },
  { key: "discount", label: "Discount", type: "currency" },
  { key: "refund", label: "Refund", type: "currency" },
  { key: "netSales", label: "Net Sales", type: "currency" },
  { key: "cogs", label: "COGS", type: "currency" },
  { key: "profit", label: "Profit", type: "currency" },
  { key: "paymentMethod", label: "Payment Method" }
];

async function baseSales() {
  return prisma.sale.findMany({
    where: { status: "COMPLETED" },
    include: { customer: true, cashier: true, payments: true, refunds: true, items: { include: { product: { include: { category: true, primarySupplier: true } } } } },
    orderBy: { createdAt: "desc" }
  });
}

function saleRows(sales: Awaited<ReturnType<typeof baseSales>>) {
  return sales.map((sale) => {
    const itemsSold = sale.items.reduce((sum, item) => sum + item.quantity, 0);
    const cogs = sale.items.reduce((sum, item) => sum + number(item.historicalCost) * item.quantity, 0);
    const refund = sale.refunds.reduce((sum, item) => sum + number(item.refundAmount), 0);
    return {
      invoice: sale.receiptNo,
      date: dateKey(sale.createdAt),
      time: sale.createdAt.toTimeString().slice(0, 5),
      cashier: sale.cashier?.fullName ?? "Deleted employee",
      itemsSold,
      grossSales: number(sale.subtotal),
      discount: number(sale.discountTotal),
      refund,
      netSales: number(sale.total) - refund,
      cogs,
      profit: number(sale.grossProfit) - refund,
      paymentMethod: sale.paymentMethod
    };
  });
}

function salesSummary(rows: Record<string, CellValue>[], labelPrefix = "") {
  const gross = rows.reduce((sum, row) => sum + Number(row.grossSales ?? 0), 0);
  const discount = rows.reduce((sum, row) => sum + Number(row.discount ?? 0), 0);
  const refund = rows.reduce((sum, row) => sum + Number(row.refund ?? 0), 0);
  const net = rows.reduce((sum, row) => sum + Number(row.netSales ?? 0), 0);
  const cogs = rows.reduce((sum, row) => sum + Number(row.cogs ?? 0), 0);
  const profit = rows.reduce((sum, row) => sum + Number(row.profit ?? 0), 0);
  const items = rows.reduce((sum, row) => sum + Number(row.itemsSold ?? 0), 0);
  return [
    { label: `${labelPrefix}Transactions`.trim(), value: rows.length, type: "number" as const },
    { label: "Items Sold", value: items, type: "number" as const },
    { label: "Gross Sales", value: round(gross), type: "currency" as const },
    { label: "Discounts", value: round(discount), type: "currency" as const },
    { label: "Refunds", value: round(refund), type: "currency" as const },
    { label: "Net Sales", value: round(net), type: "currency" as const },
    { label: "COGS", value: round(cogs), type: "currency" as const },
    { label: "Gross Profit", value: round(profit), type: "currency" as const },
    { label: "Profit Margin", value: margin(profit, net), type: "percent" as const },
    { label: "Average Transaction Value", value: rows.length ? round(net / rows.length) : 0, type: "currency" as const }
  ];
}

function aggregateRows(rows: Record<string, CellValue>[], key: string): Record<string, CellValue>[] {
  const map = new Map<string, Record<string, CellValue>>();
  for (const row of rows) {
    const group = String(row[key] ?? "Unassigned");
    const current = map.get(group) ?? { [key]: group, transactions: 0, itemsSold: 0, grossSales: 0, discount: 0, refund: 0, netSales: 0, cogs: 0, profit: 0 };
    current.transactions = Number(current.transactions) + 1;
    for (const field of ["itemsSold", "grossSales", "discount", "refund", "netSales", "cogs", "profit"]) current[field] = round(Number(current[field]) + Number(row[field] ?? 0));
    map.set(group, current);
  }
  return Array.from(map.values()).map((row): Record<string, CellValue> => ({ ...row, profitMargin: margin(Number(row.profit), Number(row.netSales)) })).sort((a, b) => Number(b.netSales) - Number(a.netSales));
}

function section(title: string, columns: ReportColumn[], rows: Record<string, CellValue>[]): ReportSection {
  return { title, columns, rows };
}

export async function buildReport(type: string, query: Record<string, unknown>, generatedBy: string): Promise<ReportPayload> {
  const { from, to, labelTo } = parsePeriod(query, type);
  const biz = await business();
  const sales = filterSales(inPeriod(await baseSales(), from, to), query);
  const transactions = saleRows(sales);
  const title = titleFor(type);
  const period = periodLabel(from, labelTo);

  if (type === "inventory-value") return inventoryValueReport(title, period, generatedBy, biz, query);
  if (type === "supplier-performance") return supplierReport(title, period, generatedBy, biz);
  if (type === "forecast") return forecastReport(title, period, generatedBy, biz, saleRows(await baseSales()));
  if (type === "products") return productSalesReport(title, period, generatedBy, biz, sales);
  if (type === "categories") return categorySalesReport(title, period, generatedBy, biz, sales);
  if (type === "employees") return employeeSalesReport(title, period, generatedBy, biz, transactions);
  if (type === "payments") return paymentReport(title, period, generatedBy, biz, transactions);
  if (type === "profit") return profitReport(title, period, generatedBy, biz, transactions);
  if (type === "monthly-sales") return monthlyReport(title, period, generatedBy, biz, transactions);
  if (type === "yearly-sales") return yearlyReport(title, period, generatedBy, biz, transactions);

  return {
    report: type,
    title,
    period,
    generatedAt: new Date(),
    generatedBy,
    business: biz,
    summary: salesSummary(transactions),
    columns: transactionColumns,
    rows: transactions,
    sections: []
  };
}

function titleFor(type: string) {
  const titles: Record<string, string> = {
    "daily-sales": "Daily Sales Report",
    "monthly-sales": "Monthly Sales Report",
    "yearly-sales": "Yearly Sales Report",
    products: "Product Sales Report",
    categories: "Category Sales Report",
    employees: "Employee Sales Report",
    payments: "Payment Methods Report",
    profit: "Profit Analysis Report",
    "inventory-value": "Inventory Value Report",
    "supplier-performance": "Supplier Performance Report",
    forecast: "Sales Forecast Report"
  };
  return titles[type] ?? "Report";
}

function monthlyReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const dailyColumns: ReportColumn[] = [
    { key: "date", label: "Date", type: "date" },
    { key: "transactions", label: "Transactions", type: "number" },
    { key: "itemsSold", label: "Items Sold", type: "number" },
    { key: "grossSales", label: "Gross Sales", type: "currency" },
    { key: "netSales", label: "Net Sales", type: "currency" },
    { key: "cogs", label: "COGS", type: "currency" },
    { key: "profit", label: "Profit", type: "currency" },
    { key: "profitMargin", label: "Profit Margin", type: "percent" }
  ];
  const daily = aggregateRows(rows, "date").map((row) => ({ ...row, date: row.date }));
  return { report: "monthly-sales", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows, "Monthly"), columns: dailyColumns, rows: daily, sections: [section("Transaction Details", transactionColumns, rows)] };
}

function yearlyReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const monthly = aggregateRows(rows.map((row) => ({ ...row, month: String(row.date).slice(0, 7) })), "month");
  const columns: ReportColumn[] = [
    { key: "month", label: "Month" },
    { key: "transactions", label: "Transactions", type: "number" },
    { key: "itemsSold", label: "Items Sold", type: "number" },
    { key: "netSales", label: "Net Sales", type: "currency" },
    { key: "cogs", label: "COGS", type: "currency" },
    { key: "profit", label: "Profit", type: "currency" },
    { key: "profitMargin", label: "Profit Margin", type: "percent" }
  ];
  return { report: "yearly-sales", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows, "Annual"), columns, rows: monthly, sections: [section("Transaction Details", transactionColumns, rows)] };
}

function productSalesReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], sales: Awaited<ReturnType<typeof baseSales>>): ReportPayload {
  const map = new Map<string, Record<string, CellValue>>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const current = map.get(item.productId) ?? { sku: item.product.sku, productName: item.product.name, category: item.product.category.name, quantitySold: 0, grossSales: 0, discount: 0, netSales: 0, cogs: 0, profit: 0 };
      current.quantitySold = Number(current.quantitySold) + item.quantity;
      current.grossSales = round(Number(current.grossSales) + number(item.sellingPrice) * item.quantity);
      current.discount = round(Number(current.discount) + number(item.productDiscount));
      current.netSales = round(Number(current.netSales) + number(item.lineTotal));
      current.cogs = round(Number(current.cogs) + number(item.historicalCost) * item.quantity);
      current.profit = round(Number(current.profit) + number(item.profit));
      map.set(item.productId, current);
    }
  }
  const rows = Array.from(map.values()).sort((a, b) => Number(b.quantitySold) - Number(a.quantitySold)).map((row, index) => ({ ...row, profitMargin: margin(Number(row.profit), Number(row.netSales)), salesRank: index + 1 }));
  const columns: ReportColumn[] = [
    { key: "sku", label: "SKU" }, { key: "productName", label: "Product Name" }, { key: "category", label: "Category" }, { key: "quantitySold", label: "Quantity Sold", type: "number" }, { key: "grossSales", label: "Gross Sales", type: "currency" }, { key: "discount", label: "Discount", type: "currency" }, { key: "netSales", label: "Net Sales", type: "currency" }, { key: "cogs", label: "COGS", type: "currency" }, { key: "profit", label: "Profit", type: "currency" }, { key: "profitMargin", label: "Profit Margin", type: "percent" }, { key: "salesRank", label: "Sales Rank", type: "number" }
  ];
  return { report: "products", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(saleRows(sales)), columns, rows, sections: [section("Least Selling Products", columns, [...rows].reverse())] };
}

function categorySalesReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], sales: Awaited<ReturnType<typeof baseSales>>): ReportPayload {
  const map = new Map<string, Record<string, CellValue>>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const category = item.product.category.name;
      const current = map.get(category) ?? { category, itemsSold: 0, grossSales: 0, discount: 0, netSales: 0, cogs: 0, profit: 0 };
      current.itemsSold = Number(current.itemsSold) + item.quantity;
      current.grossSales = round(Number(current.grossSales) + number(item.sellingPrice) * item.quantity);
      current.discount = round(Number(current.discount) + number(item.productDiscount));
      current.netSales = round(Number(current.netSales) + number(item.lineTotal));
      current.cogs = round(Number(current.cogs) + number(item.historicalCost) * item.quantity);
      current.profit = round(Number(current.profit) + number(item.profit));
      map.set(category, current);
    }
  }
  const groupedRows: Record<string, CellValue>[] = Array.from(map.values()).map((row): Record<string, CellValue> => ({ ...row, profitMargin: margin(Number(row.profit), Number(row.netSales)) }));
  const rows = groupedRows.sort((a, b) => Number(b.netSales) - Number(a.netSales));
  const columns: ReportColumn[] = [
    { key: "category", label: "Category" }, { key: "itemsSold", label: "Items Sold", type: "number" }, { key: "grossSales", label: "Gross Sales", type: "currency" }, { key: "discount", label: "Discount", type: "currency" }, { key: "netSales", label: "Net Sales", type: "currency" }, { key: "cogs", label: "COGS", type: "currency" }, { key: "profit", label: "Profit", type: "currency" }, { key: "profitMargin", label: "Profit Margin", type: "percent" }
  ];
  return { report: "categories", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(saleRows(sales)), columns, rows, sections: [] };
}

function employeeSalesReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const employeeRows = aggregateRows(rows.map((row) => ({ ...row, employee: row.cashier })), "employee");
  return { report: "employees", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows), columns: aggregateColumns("employee", "Employee"), rows: employeeRows, sections: [] };
}

function paymentReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const netSales = rows.reduce((sum, row) => sum + Number(row.netSales ?? 0), 0);
  const paymentRows = Object.values(PaymentMethod).map((method) => {
    const methodRows = rows.filter((row) => row.paymentMethod === method);
    const amount = methodRows.reduce((sum, row) => sum + Number(row.netSales ?? 0), 0);
    return { paymentMethod: method, transactionCount: methodRows.length, amountCollected: round(amount), percentageOfTotalSales: margin(amount, netSales) };
  }).filter((row) => row.transactionCount > 0);
  const columns: ReportColumn[] = [
    { key: "paymentMethod", label: "Payment Method" }, { key: "transactionCount", label: "Transaction Count", type: "number" }, { key: "amountCollected", label: "Amount Collected", type: "currency" }, { key: "percentageOfTotalSales", label: "Percentage of Total Sales", type: "percent" }
  ];
  return { report: "payments", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows), columns, rows: paymentRows, sections: [] };
}

function profitReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  return { report: "profit", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows), columns: aggregateColumns("date", "Day"), rows: aggregateRows(rows, "date"), sections: [section("By Employee", aggregateColumns("employee", "Employee"), aggregateRows(rows.map((row) => ({ ...row, employee: row.cashier })), "employee")), section("Transaction Details", transactionColumns, rows)] };
}

function aggregateColumns(key: string, label: string): ReportColumn[] {
  return [
    { key, label },
    { key: "transactions", label: "Transaction Count", type: "number" },
    { key: "itemsSold", label: "Items Sold", type: "number" },
    { key: "grossSales", label: "Gross Sales", type: "currency" },
    { key: "discount", label: "Discount", type: "currency" },
    { key: "refund", label: "Refund", type: "currency" },
    { key: "netSales", label: "Net Sales", type: "currency" },
    { key: "cogs", label: "COGS", type: "currency" },
    { key: "profit", label: "Profit", type: "currency" },
    { key: "profitMargin", label: "Profit Margin", type: "percent" }
  ];
}

async function inventoryValueReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], query: Record<string, unknown> = {}): Promise<ReportPayload> {
  const products = await prisma.product.findMany({
    where: {
      id: typeof query.productId === "string" ? query.productId : undefined,
      categoryId: typeof query.categoryId === "string" ? query.categoryId : undefined,
      primarySupplierId: typeof query.supplierId === "string" ? query.supplierId : undefined
    },
    include: { category: true, primarySupplier: true },
    orderBy: { name: "asc" }
  });
  const rows = products.map((product) => {
    const inventoryCost = number(product.costPrice) * product.currentStock;
    const expectedSellingValue = number(product.sellingPrice) * product.currentStock;
    return {
      sku: product.sku,
      product: product.name,
      category: product.category.name,
      supplier: product.primarySupplier?.name ?? "",
      currentStock: product.currentStock,
      unitCost: number(product.costPrice),
      inventoryCost: round(inventoryCost),
      sellingPrice: number(product.sellingPrice),
      expectedSellingValue: round(expectedSellingValue),
      potentialGrossProfit: round(expectedSellingValue - inventoryCost),
      stockStatus: product.currentStock === 0 ? "Out of Stock" : product.currentStock <= product.reorderLevel ? "Low Stock" : "In Stock"
    };
  });
  const columns: ReportColumn[] = [
    { key: "sku", label: "SKU" }, { key: "product", label: "Product" }, { key: "category", label: "Category" }, { key: "supplier", label: "Supplier" }, { key: "currentStock", label: "Current Stock", type: "number" }, { key: "unitCost", label: "Unit Cost", type: "currency" }, { key: "inventoryCost", label: "Inventory Cost", type: "currency" }, { key: "sellingPrice", label: "Selling Price", type: "currency" }, { key: "expectedSellingValue", label: "Expected Selling Value", type: "currency" }, { key: "potentialGrossProfit", label: "Potential Gross Profit", type: "currency" }, { key: "stockStatus", label: "Stock Status" }
  ];
  return { report: "inventory-value", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: [{ label: "Total Products", value: rows.length, type: "number" }, { label: "Total Units", value: rows.reduce((sum, row) => sum + Number(row.currentStock), 0), type: "number" }, { label: "Total Inventory Cost", value: round(rows.reduce((sum, row) => sum + Number(row.inventoryCost), 0)), type: "currency" }, { label: "Expected Selling Value", value: round(rows.reduce((sum, row) => sum + Number(row.expectedSellingValue), 0)), type: "currency" }, { label: "Potential Gross Profit", value: round(rows.reduce((sum, row) => sum + Number(row.potentialGrossProfit), 0)), type: "currency" }, { label: "Low Stock Items", value: rows.filter((row) => row.stockStatus === "Low Stock").length, type: "number" }, { label: "Out of Stock Items", value: rows.filter((row) => row.stockStatus === "Out of Stock").length, type: "number" }], columns, rows, sections: [] };
}

async function supplierReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"]): Promise<ReportPayload> {
  const suppliers = await prisma.supplier.findMany({ include: { deliveries: { include: { items: true } }, evaluations: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { name: "asc" } });
  const rows = suppliers.map((supplier) => {
    const totalPurchaseValue = supplier.deliveries.reduce((sum, delivery) => sum + number(delivery.totalAmount), 0);
    const completed = supplier.deliveries.filter((delivery) => delivery.completedAt);
    const onTime = completed.filter((delivery) => delivery.expectedDate && delivery.completedAt && delivery.completedAt <= delivery.expectedDate).length;
    const late = completed.length - onTime;
    return { supplier: supplier.name, totalPurchaseValue: round(totalPurchaseValue), deliveries: supplier.deliveries.length, completedDeliveries: completed.length, onTimeDeliveries: onTime, lateDeliveries: late, returnedItems: 0, returnRate: number(supplier.evaluations[0]?.returnRate), onTimeRate: number(supplier.evaluations[0]?.onTimeDeliveryPercentage), performanceScore: number(supplier.evaluations[0]?.performanceScore) };
  });
  const columns: ReportColumn[] = [
    { key: "supplier", label: "Supplier" }, { key: "totalPurchaseValue", label: "Total Purchase Value", type: "currency" }, { key: "deliveries", label: "Deliveries", type: "number" }, { key: "completedDeliveries", label: "Completed Deliveries", type: "number" }, { key: "onTimeDeliveries", label: "On-Time Deliveries", type: "number" }, { key: "lateDeliveries", label: "Late Deliveries", type: "number" }, { key: "returnedItems", label: "Returned Items", type: "number" }, { key: "returnRate", label: "Return Rate", type: "percent" }, { key: "onTimeRate", label: "On-Time Rate", type: "percent" }, { key: "performanceScore", label: "Performance Score", type: "number" }
  ];
  return { report: "supplier-performance", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: [{ label: "Suppliers", value: rows.length, type: "number" }, { label: "Total Purchase Value", value: round(rows.reduce((sum, row) => sum + Number(row.totalPurchaseValue), 0)), type: "currency" }, { label: "Completed Deliveries", value: rows.reduce((sum, row) => sum + Number(row.completedDeliveries), 0), type: "number" }], columns, rows, sections: [] };
}

function forecastReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const monthly = aggregateRows(rows.map((row) => ({ ...row, month: String(row.date).slice(0, 7) })), "month").sort((a, b) => String(a.month).localeCompare(String(b.month)));
  const forecastRows = monthly.map((row, index) => {
    const previous = monthly.slice(Math.max(0, index - 2), index + 1);
    const movingAverage = previous.length ? previous.reduce((sum, item) => sum + Number(item.netSales), 0) / previous.length : 0;
    return { historicalSalesPeriod: row.month, historicalSales: Number(row.netSales), movingAverage: round(movingAverage), forecastSales: round(movingAverage), suggestedDemand: round(movingAverage), suggestedReorderQuantity: 0 };
  });
  const columns: ReportColumn[] = [
    { key: "historicalSalesPeriod", label: "Historical Sales Period" }, { key: "historicalSales", label: "Historical Sales", type: "currency" }, { key: "movingAverage", label: "Moving Average", type: "currency" }, { key: "forecastSales", label: "Forecast Sales", type: "currency" }, { key: "suggestedDemand", label: "Suggested Demand", type: "currency" }, { key: "suggestedReorderQuantity", label: "Suggested Reorder Quantity", type: "number" }
  ];
  return { report: "forecast", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: [{ label: "Historical Periods", value: forecastRows.length, type: "number" }, { label: "Forecast Method", value: "3-month moving average" }, { label: "Latest Forecast / Estimated", value: forecastRows.at(-1)?.forecastSales ?? 0, type: "currency" }], columns, rows: forecastRows, sections: [] };
}
```

<a id="source-36"></a>

## backend/src/services/salesService.ts

```typescript
import { MovementType, PaymentMethod, Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { createLowStockAlert } from "./inventoryService.js";

export async function listHeldSales(cashierId: string) {
  return prisma.heldSale.findMany({
    where: { cashierId },
    include: { items: { include: { product: { include: { category: true, primarySupplier: true } } } } },
    orderBy: { updatedAt: "desc" }
  });
}

export async function holdSale(input: {
  customerId?: string | null;
  cashierId: string;
  notes?: string;
  items: { productId: string; quantity: number; productDiscount: string }[];
}) {
  return prisma.$transaction(async (tx) => {
    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new AppError("Product not found", 404);
      if (product.currentStock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);
    }

    return tx.heldSale.create({
      data: {
        customerId: input.customerId,
        cashierId: input.cashierId,
        notes: input.notes,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            discount: new Prisma.Decimal(item.productDiscount)
          }))
        }
      },
      include: { items: { include: { product: { include: { category: true, primarySupplier: true } } } } }
    });
  });
}

export async function deleteHeldSale(id: string, cashierId: string) {
  const heldSale = await prisma.heldSale.findFirst({ where: { id, cashierId } });
  if (!heldSale) throw new AppError("Held order not found", 404);
  await prisma.heldSale.delete({ where: { id } });
}

export async function completeSale(input: {
  receiptNo: string;
  customerId?: string | null;
  cashierId: string;
  paymentMethod: PaymentMethod;
  amountPaid: string;
  transactionDiscount: string;
  idempotencyKey: string;
  items: { productId: string; quantity: number; productDiscount: string }[];
}) {
  const existing = await prisma.sale.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { items: true, payments: true } });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const lines = [];
    let subtotal = new Prisma.Decimal(0);
    let grossProfit = new Prisma.Decimal(0);
    for (const item of input.items) {
      await tx.$executeRaw`SELECT id FROM "Product" WHERE id = ${item.productId}::uuid FOR UPDATE`;
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new AppError("Product not found", 404);
      if (product.currentStock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);
      const productDiscount = new Prisma.Decimal(item.productDiscount);
      const lineTotal = product.sellingPrice.mul(item.quantity).sub(productDiscount);
      const profit = product.sellingPrice.sub(product.costPrice).mul(item.quantity).sub(productDiscount);
      subtotal = subtotal.add(lineTotal);
      grossProfit = grossProfit.add(profit);
      lines.push({ product, quantity: item.quantity, productDiscount, lineTotal, profit });
    }

    const discountTotal = new Prisma.Decimal(input.transactionDiscount);
    const total = subtotal.sub(discountTotal);
    const amountPaid = new Prisma.Decimal(input.amountPaid);
    if (amountPaid.lt(total)) throw new AppError("Amount paid is below total", 400);

    const sale = await tx.sale.create({
      data: {
        receiptNo: input.receiptNo,
        customerId: input.customerId,
        cashierId: input.cashierId,
        subtotal,
        discountTotal,
        tax: 0,
        total,
        amountPaid,
        change: amountPaid.sub(total),
        paymentMethod: input.paymentMethod,
        idempotencyKey: input.idempotencyKey,
        grossProfit,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            sellingPrice: line.product.sellingPrice,
            historicalCost: line.product.costPrice,
            productDiscount: line.productDiscount,
            lineTotal: line.lineTotal,
            profit: line.profit
          }))
        },
        payments: {
          create: {
            method: input.paymentMethod,
            amount: total,
            processedById: input.cashierId
          }
        }
      },
      include: { items: { include: { product: true } }, payments: true, customer: true, cashier: true }
    });

    for (const line of lines) {
      const newQuantity = line.product.currentStock - line.quantity;
      await tx.product.update({ where: { id: line.product.id }, data: { currentStock: newQuantity } });
      await tx.stockMovement.create({
        data: {
          productId: line.product.id,
          employeeId: input.cashierId,
          previousQuantity: line.product.currentStock,
          quantityChanged: -line.quantity,
          newQuantity,
          movementType: MovementType.SALE,
          referenceNo: input.receiptNo,
          reason: "POS sale"
        }
      });
      await createLowStockAlert(tx, line.product.id);
    }

    return sale;
  });
}

export async function processRefund(input: {
  saleId: string;
  reason: string;
  refundMethod: PaymentMethod;
  processedById: string;
  items: { saleItemId: string; quantity: number; condition: string }[];
}) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id: input.saleId }, include: { items: true } });
    if (!sale) throw new AppError("Sale not found", 404);
    let refundAmount = new Prisma.Decimal(0);
    const refundItems = [];
    for (const item of input.items) {
      const saleItem = sale.items.find((row) => row.id === item.saleItemId);
      if (!saleItem) throw new AppError("Sale item not found", 404);
      if (item.quantity > saleItem.quantity) throw new AppError("Refund quantity exceeds sold quantity", 400);
      const amount = saleItem.lineTotal.div(saleItem.quantity).mul(item.quantity);
      refundAmount = refundAmount.add(amount);
      refundItems.push({ productId: saleItem.productId, quantity: item.quantity, condition: item.condition, amount });
    }
    const refund = await tx.refund.create({
      data: {
        saleId: sale.id,
        reason: input.reason,
        refundAmount,
        refundMethod: input.refundMethod,
        processedById: input.processedById,
        items: { create: refundItems }
      },
      include: { items: true }
    });
    for (const item of refundItems) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      const returnsToInventory = item.condition === "Return to inventory";
      const newQuantity = returnsToInventory ? product.currentStock + item.quantity : product.currentStock;
      if (returnsToInventory) await tx.product.update({ where: { id: product.id }, data: { currentStock: newQuantity } });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          employeeId: input.processedById,
          previousQuantity: product.currentStock,
          quantityChanged: returnsToInventory ? item.quantity : 0,
          newQuantity,
          movementType: MovementType.REFUND,
          referenceNo: `REF-${refund.id}`,
          reason: input.reason
        }
      });
    }
    await tx.sale.update({ where: { id: sale.id }, data: { status: SaleStatus.PARTIALLY_REFUNDED } });
    return refund;
  });
}
```

<a id="source-37"></a>

## backend/src/services/tokenService.ts

```typescript
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

export function signAccessToken(user: { id: string; role: string; email: string; fullName: string }) {
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, fullName: user.fullName },
    env.JWT_ACCESS_SECRET,
    options
  );
}

export function signRefreshToken(userId: string) {
  const options: SignOptions = { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, options);
}

export async function persistRefreshToken(userId: string, token: string) {
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
}

export async function findRefreshToken(rawToken: string) {
  const active = await prisma.refreshToken.findMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } }
  });
  for (const stored of active) {
    if (await bcrypt.compare(rawToken, stored.tokenHash)) return stored;
  }
  return null;
}
```

<a id="source-38"></a>

## backend/src/types/express.d.ts

```typescript
declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      roleId: string;
      roleName: string;
      email: string;
      fullName: string;
      permissions: string[];
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
```

<a id="source-39"></a>

## backend/src/utils/AppError.ts

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public errors: unknown[] = []
  ) {
    super(message);
  }
}
```

<a id="source-40"></a>

## backend/src/utils/apiResponse.ts

```typescript
import { Response } from "express";

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export function ok<T>(res: Response, message: string, data: T, meta?: ApiMeta) {
  return res.json({ success: true, message, data, meta: meta ?? {} });
}

export function created<T>(res: Response, message: string, data: T) {
  return res.status(201).json({ success: true, message, data, meta: {} });
}
```

<a id="source-41"></a>

## backend/src/utils/asyncHandler.ts

```typescript
import { NextFunction, Request, Response } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

<a id="source-42"></a>

## backend/src/validators/authValidators.ts

```typescript
import { z } from "zod";

const password = z.string().min(8);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password
});
```

<a id="source-43"></a>

## backend/src/validators/catalogValidators.ts

```typescript
import { z } from "zod";
import { money } from "./common.js";

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE")
});

export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  barcode: z.string().min(3),
  categoryId: z.string().uuid(),
  primarySupplierId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  costPrice: money,
  sellingPrice: money,
  currentStock: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(0),
  unit: z.string().default("pcs"),
  imageUrl: z.string().optional().nullable(),
  tracksExpiration: z.boolean().default(false),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE")
});

export const supplierSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryLeadTime: z.coerce.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  notes: z.string().optional()
});

export const supplierProductSchema = z.object({
  supplierId: z.string().uuid(),
  productId: z.string().uuid()
});

export const customerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  customerType: z.enum(["Walk-in", "Regular", "Member", "Wholesale"]).default("Walk-in"),
  loyaltyPoints: z.coerce.number().int().min(0).default(0),
  creditBalance: money.default("0"),
  birthday: z.string().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE")
});
```

<a id="source-44"></a>

## backend/src/validators/common.ts

```typescript
import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().uuid() });
export const money = z.union([z.string(), z.number()]).transform((v) => String(v));
export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});
```

<a id="source-45"></a>

## backend/src/validators/inventoryValidators.ts

```typescript
import { z } from "zod";
import { money } from "./common.js";

export const stockInSchema = z.object({
  referenceNo: z.string().min(3),
  supplierId: z.string().uuid(),
  deliveryDate: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    unitCost: money,
    expirationDate: z.string().optional().nullable(),
    batchNumber: z.string().optional()
  })).min(1)
});

export const stockOutSchema = z.object({
  referenceNo: z.string().min(3),
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  reason: z.enum(["Damaged", "Expired", "Returned to supplier", "Lost", "Internal use", "Product transfer", "Manual correction"]),
  notes: z.string().optional()
});

export const adjustmentSchema = z.object({
  productId: z.string().uuid(),
  physicalQuantity: z.coerce.number().int().min(0),
  reason: z.string().min(3),
  notes: z.string().optional()
});

export const saleSchema = z.object({
  receiptNo: z.string().min(3),
  customerId: z.string().uuid().optional().nullable(),
  paymentMethod: z.enum(["CASH", "GCASH", "MAYA", "BANK_TRANSFER", "DEBIT_CARD", "CREDIT_CARD", "CUSTOMER_CREDIT", "MIXED"]),
  amountPaid: money,
  transactionDiscount: money.default("0"),
  idempotencyKey: z.string().min(8),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    productDiscount: money.default("0")
  })).min(1)
});

export const heldSaleSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    productDiscount: money.default("0")
  })).min(1)
});

export const refundSchema = z.object({
  saleId: z.string().uuid(),
  reason: z.string().min(3),
  refundMethod: z.enum(["CASH", "GCASH", "MAYA", "BANK_TRANSFER", "DEBIT_CARD", "CREDIT_CARD", "CUSTOMER_CREDIT", "MIXED"]),
  items: z.array(z.object({
    saleItemId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    condition: z.enum(["Return to inventory", "Damaged", "Defective", "Return to supplier"])
  })).min(1)
});
```

<a id="source-46"></a>

## backend/src/validators/paymongoValidators.ts

```typescript
import { z } from "zod";
import { money } from "./common.js";

export const gcashCheckoutSchema = z.object({
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    productDiscount: money.default("0")
  })).min(1)
});
```

<a id="source-47"></a>

## backend/src/validators/userValidators.ts

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  roleId: z.string().uuid(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});

export const updateUserSchema = createUserSchema.omit({ password: true }).partial();
```

<a id="source-48"></a>

## backend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src", "prisma/seed.ts"]
}
```

<a id="source-49"></a>

## frontend/.env.example

```dotenv
VITE_API_URL=http://localhost:5000/api
```

<a id="source-50"></a>

## frontend/eslint.config.js

```javascript
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import hooks from "eslint-plugin-react-hooks";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { project: "./tsconfig.json" } },
    plugins: { "@typescript-eslint": tseslint, "react-hooks": hooks },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
];
```

<a id="source-51"></a>

## frontend/index.html

```html
<title>Inventory</title>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

<a id="source-52"></a>

## frontend/package.json

```json
{
  "name": "smartstock-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@tanstack/react-query": "^5.59.20",
    "axios": "^1.7.7",
    "date-fns": "^4.1.0",
    "exceljs": "^4.4.0",
    "html5-qrcode": "^2.3.8",
    "jspdf": "^2.5.2",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.1",
    "react-hot-toast": "^2.4.1",
    "react-router-dom": "^6.28.0",
    "recharts": "^2.13.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@typescript-eslint/eslint-plugin": "^8.13.0",
    "@typescript-eslint/parser": "^8.13.0",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.14.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vite": "^5.4.10"
  }
}
```

<a id="source-53"></a>

## frontend/postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

<a id="source-54"></a>

## frontend/public/_redirects

```text
/* /index.html 200
```

<a id="source-55"></a>

## frontend/src/App.tsx

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ForgotPassword, ResetPassword } from "./pages/AuthUtility";
import { Dashboard } from "./pages/Dashboard";
import { StockIn, StockOut, InventoryAdjustment } from "./pages/InventoryActions";
import { Login } from "./pages/Login";
import { Notifications } from "./pages/Notifications";
import { POS } from "./pages/POS";
import { Profile, SettingsPage } from "./pages/ProfileSettings";
import { ReportDetail, ReportsIndex } from "./pages/Reports";
import { ResourcePage } from "./pages/ResourcePage";
import { RoleManagement } from "./pages/RoleManagement";
import { Unauthorized } from "./pages/Unauthorized";
import { PermissionRoute, ProtectedRoute } from "./routes/ProtectedRoute";

const queryClient = new QueryClient();

function Shell({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/inventory" replace />} />
              <Route path="/unauthorized" element={<Shell><Unauthorized /></Shell>} />
              <Route path="/dashboard" element={<PermissionRoute permission="dashboard.view"><Shell><Dashboard /></Shell></PermissionRoute>} />
              <Route path="/pos" element={<PermissionRoute permission="pos.access"><Shell><POS /></Shell></PermissionRoute>} />
              <Route path="/products" element={<PermissionRoute permission="products.view"><Shell><ResourcePage title="Products" endpoint="/products?limit=100" columns={["name", "sku", "barcode", "category", "currentStock", "sellingPrice", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/products/archive" element={<PermissionRoute permission="products.view"><Shell><ResourcePage title="Product archive" endpoint="/products?limit=100&status=ARCHIVED" columns={["name", "sku", "barcode", "category", "currentStock", "sellingPrice", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/products/new" element={<PermissionRoute permission="products.create"><Shell><ResourcePage title="New product" endpoint="/categories" columns={["name", "description", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/products/:id" element={<PermissionRoute permission="products.view"><Shell><ResourcePage title="Product profile" endpoint="/products?limit=100" columns={["name", "sku", "barcode", "currentStock"]} /></Shell></PermissionRoute>} />
              <Route path="/categories" element={<PermissionRoute permission="categories.view"><Shell><ResourcePage title="Categories" endpoint="/categories" columns={["name", "description", "status", "inventoryValue", "totalSales", "totalProfit"]} /></Shell></PermissionRoute>} />
              <Route path="/barcodes" element={<PermissionRoute permission="barcodes.view"><Shell><ResourcePage title="Barcodes" endpoint="/products?limit=100" columns={["name", "barcode", "sku", "currentStock"]} /></Shell></PermissionRoute>} />
              <Route path="/inventory" element={<PermissionRoute permission="inventory.view"><Shell><ResourcePage title="Inventory" endpoint="/products?limit=100" columns={["name", "sku", "currentStock", "reorderLevel", "unit"]} /></Shell></PermissionRoute>} />
              <Route path="/inventory/stock-in" element={<PermissionRoute permission="inventory.stock_in"><Shell><StockIn /></Shell></PermissionRoute>} />
              <Route path="/inventory/stock-out" element={<PermissionRoute permission="inventory.stock_out"><Shell><StockOut /></Shell></PermissionRoute>} />
              <Route path="/inventory/adjustments" element={<PermissionRoute permission="inventory.adjustment_create"><Shell><InventoryAdjustment /></Shell></PermissionRoute>} />
              <Route path="/inventory/movements" element={<PermissionRoute permission="inventory.movement_view"><Shell><ResourcePage title="Stock movements" endpoint="/stock-movements" columns={["referenceNo", "movementType", "product", "quantityChanged", "newQuantity", "createdAt"]} /></Shell></PermissionRoute>} />
              <Route path="/inventory/low-stock" element={<PermissionRoute permission="inventory.view"><Shell><ResourcePage title="Low stock" endpoint="/inventory/low-stock" columns={["name", "sku", "currentStock", "reorderLevel"]} /></Shell></PermissionRoute>} />
              <Route path="/suppliers" element={<PermissionRoute permission="suppliers.view"><Shell><ResourcePage title="Suppliers" endpoint="/suppliers" columns={["name", "contactPerson", "phone", "email", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/supplier-products" element={<PermissionRoute permission="suppliers.view"><Shell><ResourcePage title="Supplier Products" endpoint="/supplier-products" columns={["supplier", "product", "sku", "barcode", "category", "currentStock", "sellingPrice", "status"]} showCreate={false} /></Shell></PermissionRoute>} />
              <Route path="/suppliers/:id" element={<PermissionRoute permission="suppliers.view"><Shell><ResourcePage title="Supplier profile" endpoint="/suppliers" columns={["name", "contactPerson", "phone", "email"]} /></Shell></PermissionRoute>} />
              <Route path="/supplier-deliveries" element={<PermissionRoute permission="inventory.movement_view"><Shell><ResourcePage title="Supplier deliveries" endpoint="/stock-movements" columns={["referenceNo", "product", "quantityChanged", "createdAt"]} /></Shell></PermissionRoute>} />
              <Route path="/supplier-performance" element={<PermissionRoute permission="reports.supplier_performance"><Shell><ResourcePage title="Supplier performance" endpoint="/supplier-performance" columns={["supplier", "completedDeliveries", "onTimeRate", "performanceScore"]} /></Shell></PermissionRoute>} />
              <Route path="/customers" element={<PermissionRoute permission="customers.view"><Shell><ResourcePage title="Customers" endpoint="/customers" columns={["fullName", "phone", "email", "customerType", "loyaltyPoints"]} /></Shell></PermissionRoute>} />
              <Route path="/customers/:id" element={<PermissionRoute permission="customers.view"><Shell><ResourcePage title="Customer profile" endpoint="/customers" columns={["fullName", "phone", "email", "customerType"]} /></Shell></PermissionRoute>} />
              <Route path="/employees" element={<PermissionRoute permission="users.view"><Shell><ResourcePage title="Employees" endpoint="/users" columns={["fullName", "email", "role", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/users" element={<PermissionRoute permission="users.view"><Shell><ResourcePage title="Users" endpoint="/users" columns={["fullName", "email", "role", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/roles" element={<PermissionRoute permission="roles.view"><Shell><RoleManagement /></Shell></PermissionRoute>} />
              <Route path="/sales" element={<PermissionRoute anyPermissions={["sales.view_all", "sales.view_own"]}><Shell><ResourcePage title="Sales" endpoint="/sales" columns={["receiptNo", "customer", "cashier", "total", "paymentMethod", "status", "createdAt"]} /></Shell></PermissionRoute>} />
              <Route path="/sales/:id" element={<PermissionRoute anyPermissions={["sales.view_all", "sales.view_own"]}><Shell><ResourcePage title="Sale detail" endpoint="/sales" columns={["receiptNo", "total", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/refunds" element={<PermissionRoute permission="refunds.view"><Shell><ResourcePage title="Refunds" endpoint="/sales" columns={["receiptNo", "total", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/reports" element={<PermissionRoute anyPermissions={["reports.daily", "reports.monthly", "reports.yearly", "reports.products", "reports.categories", "reports.payments", "reports.employees", "reports.profit", "reports.inventory_value", "reports.supplier_performance", "reports.forecast"]}><Shell><ReportsIndex /></Shell></PermissionRoute>} />
              <Route path="/reports/:type" element={<PermissionRoute anyPermissions={["reports.daily", "reports.monthly", "reports.yearly", "reports.products", "reports.categories", "reports.payments", "reports.employees", "reports.profit", "reports.inventory_value", "reports.supplier_performance", "reports.forecast"]}><Shell><ReportDetail /></Shell></PermissionRoute>} />
              <Route path="/notifications" element={<PermissionRoute permission="notifications.view"><Shell><Notifications /></Shell></PermissionRoute>} />
              <Route path="/audit-logs" element={<PermissionRoute permission="audit_logs.view"><Shell><ResourcePage title="Audit logs" endpoint="/audit-logs" columns={["action", "module", "recordId", "user", "createdAt"]} /></Shell></PermissionRoute>} />
              <Route path="/profile" element={<Shell><Profile /></Shell>} />
              <Route path="/settings" element={<PermissionRoute permission="settings.view"><Shell><SettingsPage /></Shell></PermissionRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

<a id="source-56"></a>

## frontend/src/components/barcode/BarcodeLabel.tsx

```tsx
import { useMemo } from "react";

const code128Patterns = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const eanLeftOdd = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const eanLeftEven = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const eanRight = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const eanParity = ["OOOOOO", "OOEOEE", "OOEEOE", "OOEEEO", "OEOOEE", "OEEOOE", "OEEEOO", "OEOEOE", "OEOEEO", "OEEOEO"];

interface BarcodeLabelProps {
  value: string;
  productName?: string;
  price?: string;
  className?: string;
}

function encodeCode128B(value: string) {
  const trimmedValue = value.trim();
  const characters = [...trimmedValue];

  if (!trimmedValue || characters.some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code > 126;
  })) {
    return null;
  }

  const values = characters.map((character) => character.charCodeAt(0) - 32);
  const checksum = values.reduce((sum, code, index) => sum + code * (index + 1), 104) % 103;
  return [104, ...values, checksum, 106].map((code) => code128Patterns[code]).join("");
}

function ean13CheckDigit(firstTwelveDigits: string) {
  const sum = [...firstTwelveDigits].reduce((total, digit, index) => {
    return total + Number(digit) * (index % 2 === 0 ? 1 : 3);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

function encodeEan13(value: string) {
  const trimmedValue = value.trim();
  if (!/^\d{13}$/.test(trimmedValue)) return null;
  if (ean13CheckDigit(trimmedValue.slice(0, 12)) !== trimmedValue[12]) return null;

  const firstDigit = Number(trimmedValue[0]);
  const parity = eanParity[firstDigit];
  const leftDigits = trimmedValue.slice(1, 7);
  const rightDigits = trimmedValue.slice(7);
  const leftPattern = [...leftDigits].map((digit, index) => {
    return parity[index] === "O" ? eanLeftOdd[Number(digit)] : eanLeftEven[Number(digit)];
  }).join("");
  const rightPattern = [...rightDigits].map((digit) => eanRight[Number(digit)]).join("");
  return `101${leftPattern}01010${rightPattern}101`;
}

export function BarcodeLabel({ value, productName, price, className = "" }: BarcodeLabelProps) {
  const encodedEan13 = useMemo(() => encodeEan13(value), [value]);
  const encodedCode128 = useMemo(() => encodeCode128B(value), [value]);
  const encodedPattern = encodedEan13 ?? encodedCode128;

  if (!encodedPattern) {
    return (
      <div className={`rounded-md border border-dashed border-line p-4 text-sm text-slate-500 dark:border-slate-700 ${className}`}>
        Generate or enter a barcode to preview it.
      </div>
    );
  }

  const moduleWidth = encodedEan13 ? 4 : 2;
  const barcodeHeight = encodedEan13 ? 108 : 88;
  const quietZone = encodedEan13 ? 44 : 24;
  const patternModules = encodedEan13 ? encodedPattern.length : [...encodedPattern].reduce((sum, width) => sum + Number(width), 0);
  const svgWidth = patternModules * moduleWidth + quietZone * 2;
  let x = quietZone;

  return (
    <div className={`barcode-print rounded-md border border-line bg-white p-4 text-center text-slate-950 ${className}`}>
      {productName && <div className="mb-2 truncate text-sm font-semibold">{productName}</div>}
      <svg viewBox={`0 0 ${svgWidth} ${barcodeHeight}`} className="mx-auto h-32 max-w-full" role="img" aria-label={`Barcode ${value}`}>
        <rect width={svgWidth} height={barcodeHeight} fill="white" />
        {encodedEan13 ? [...encodedPattern].map((bit, index) => {
          if (bit !== "1") return null;
          return <rect key={index} x={quietZone + index * moduleWidth} y="0" width={moduleWidth} height={barcodeHeight} fill="black" />;
        }) : [...encodedPattern].map((widthCharacter, index) => {
          const width = Number(widthCharacter) * moduleWidth;
          const currentX = x;
          x += width;
          if (index % 2 !== 0) return null;
          return <rect key={`${index}-${currentX}`} x={currentX} y="0" width={width} height={barcodeHeight} fill="black" />;
        })}
      </svg>
      <div className="mt-2 font-mono text-sm tracking-normal">{value.trim()}</div>
      {price && <div className="mt-1 text-sm font-semibold">{price}</div>}
    </div>
  );
}
```

<a id="source-57"></a>

## frontend/src/components/barcode/CameraBarcodeScanner.tsx

```tsx
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CameraDevice, Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, RefreshCw, X } from "lucide-react";
import { Button } from "../ui/Button";

const barcodeFormats = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128
];

interface CameraBarcodeScannerProps {
  onClose: () => void;
  onScan: (barcode: string) => void;
  continuous?: boolean;
  compact?: boolean;
}

export function CameraBarcodeScanner({ onClose, onScan, continuous = false, compact = false }: CameraBarcodeScannerProps) {
  const generatedId = useId().replace(/:/g, "");
  const readerId = `barcode-camera-${generatedId}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const lastBarcodeRef = useRef("");
  const lastBarcodeAtRef = useRef(0);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [status, setStatus] = useState("Preparing camera...");
  const [error, setError] = useState("");
  const [detectedBarcode, setDetectedBarcode] = useState("");

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;

    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // The scanner may already be stopped while React is unmounting.
    }
  }, []);

  const loadCameras = useCallback(async () => {
    setError("");
    setStatus("Checking camera permission...");

    if (!window.isSecureContext) {
      setStatus("Camera unavailable");
      setError("Camera scanning requires localhost or HTTPS. Open the app on http://localhost:5173 on this computer.");
      return;
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);

      if (devices.length === 0) {
        setStatus("No camera found");
        setError("No camera was found. Connect a webcam or allow camera permission in the browser.");
        return;
      }

      setCameraId((current) => current || devices.find((device) => /back|rear|environment/i.test(device.label))?.id || devices[0].id);
    } catch (cameraError) {
      setStatus("Camera blocked");
      setError(cameraError instanceof Error ? cameraError.message : "Browser blocked camera access.");
    }
  }, []);

  useEffect(() => {
    void loadCameras();
  }, [loadCameras]);

  useEffect(() => {
    if (!cameraId) return;
    let cancelled = false;

    async function startScanner() {
      await stopScanner();
      hasScannedRef.current = false;
      setDetectedBarcode("");
      setError("");
      setStatus("Starting camera...");

      try {
        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: barcodeFormats,
          useBarCodeDetectorIfSupported: true,
          verbose: false
        });
        scannerRef.current = scanner;

        await scanner.start(
          cameraId,
          {
            fps: 30,
            qrbox: (viewfinderWidth, viewfinderHeight) => ({
              width: Math.floor(viewfinderWidth * (compact ? 0.9 : 0.98)),
              height: Math.floor(Math.min(viewfinderHeight * (compact ? 0.36 : 0.42), compact ? 140 : 260))
            }),
            aspectRatio: 1.777778,
            disableFlip: true
          },
          (decodedText) => {
            const scannedBarcode = decodedText.trim();
            if (!scannedBarcode) return;
            const now = Date.now();
            if (continuous) {
              if (lastBarcodeRef.current === scannedBarcode && now - lastBarcodeAtRef.current < 2500) return;
              lastBarcodeRef.current = scannedBarcode;
              lastBarcodeAtRef.current = now;
            } else {
              if (hasScannedRef.current) return;
              hasScannedRef.current = true;
            }
            setDetectedBarcode(scannedBarcode);
            setStatus(continuous ? "Barcode detected. Ready for next scan." : "Barcode detected");
            onScan(scannedBarcode);
          },
          undefined
        );

        if (!cancelled) setStatus("Camera ready. Point it at the barcode.");
      } catch (scanError) {
        if (cancelled) return;
        setStatus("Camera failed");
        setError(scanError instanceof Error ? scanError.message : "Camera scanner could not start.");
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [cameraId, compact, continuous, onScan, readerId, stopScanner]);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Camera size={18} />
          Camera barcode scanner
        </div>
        <Button type="button" className="h-9 bg-slate-700 px-3 hover:bg-slate-800" onClick={onClose}>
          <X size={16} />
          Close
        </Button>
      </div>

      <div className={`grid gap-2 ${compact ? "sm:grid-cols-[minmax(0,1fr)_auto]" : "sm:grid-cols-[1fr_auto]"}`}>
        <select
          className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950"
          value={cameraId}
          onChange={(event) => setCameraId(event.target.value)}
          disabled={cameras.length === 0}
        >
          {cameras.length === 0 && <option value="">No camera available</option>}
          {cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.label || `Camera ${camera.id}`}</option>)}
        </select>
        <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={() => void loadCameras()}>
          <RefreshCw size={16} />
          Retry
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-slate-950 dark:border-slate-700">
        <div id={readerId} className={`${compact ? "min-h-[150px] [&_video]:max-h-[180px]" : "min-h-[260px]"} w-full text-white [&_video]:w-full [&_video]:object-cover`} />
      </div>

      <p className={`${compact ? "text-xs" : "text-sm"} text-slate-600 dark:text-slate-300`}>{status}</p>
      {detectedBarcode && <p className={`${compact ? "text-xs" : "text-sm"} text-teal-700`}>Detected: {detectedBarcode}</p>}
      {error && <p className={`${compact ? "text-xs" : "text-sm"} text-red-600`}>{error}</p>}
    </div>
  );
}
```

<a id="source-58"></a>

## frontend/src/components/layout/AppLayout.tsx

```tsx
import { Archive, Bell, Boxes, ChartNoAxesCombined, ClipboardList, LogOut, Menu, Moon, Package, Receipt, Settings, ShieldCheck, ShoppingCart, Sun, Users, X } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getData } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined, anyPermissions: ["dashboard.view"] },
  { to: "/pos", label: "POS", icon: ShoppingCart, anyPermissions: ["pos.access"] },
  { to: "/products", label: "Products", icon: Package, anyPermissions: ["products.view"] },
  { to: "/products/archive", label: "Archive", icon: Archive, anyPermissions: ["products.view"] },
  { to: "/inventory", label: "Inventory", icon: Boxes, anyPermissions: ["inventory.view"] },
  { to: "/sales", label: "Sales", icon: Receipt, anyPermissions: ["sales.view_all", "sales.view_own"] },
  { to: "/suppliers", label: "Suppliers", icon: ClipboardList, anyPermissions: ["suppliers.view"] },
  { to: "/supplier-products", label: "Supplier Products", icon: Package, anyPermissions: ["suppliers.view"] },
  { to: "/customers", label: "Customers", icon: Users, anyPermissions: ["customers.view"] },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined, anyPermissions: ["reports.daily", "reports.monthly", "reports.yearly", "reports.products", "reports.categories", "reports.payments", "reports.employees", "reports.profit", "reports.inventory_value", "reports.supplier_performance", "reports.forecast"] },
  { to: "/users", label: "Users", icon: Users, anyPermissions: ["users.view"] },
  { to: "/roles", label: "Roles", icon: ShieldCheck, anyPermissions: ["roles.view"] },
  { to: "/audit-logs", label: "Audit Logs", icon: ClipboardList, anyPermissions: ["audit_logs.view"] },
  { to: "/settings", label: "Settings", icon: Settings, anyPermissions: ["settings.view"] }
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasAnyPermission } = useAuth();
  const { data: notifications = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => getData<Array<{ isRead: boolean }>>("/notifications"), enabled: Boolean(user) });
  const unread = notifications.filter((item) => !item.isRead).length;
  const crumbs = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);

  function toggleTheme() {
    setDark((value) => {
      document.documentElement.classList.toggle("dark", !value);
      return !value;
    });
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-ink dark:bg-slate-950 dark:text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-line bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-5 dark:border-slate-800">
          <Link to="/inventory" className="text-lg font-bold">Inventory</Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className="space-y-1 p-3">
          {nav.filter((item) => hasAnyPermission(item.anyPermissions)).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1 hover:scale-[1.02] hover:shadow-sm ${isActive ? "bg-teal-50 text-brand dark:bg-teal-950" : "text-slate-600 hover:bg-teal-50 hover:text-brand dark:text-slate-300 dark:hover:bg-teal-950 dark:hover:text-teal-100"}`}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
            <div>
              <div className="text-xs text-slate-500">Asia/Manila</div>
              <div className="text-sm font-semibold capitalize">{crumbs.join(" / ") || "dashboard"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="rounded-md border border-line p-2 dark:border-slate-700" aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={() => navigate("/notifications")} className="relative rounded-md border border-line p-2 dark:border-slate-700" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-xs text-white">{unread}</span>}
            </button>
            <button onClick={() => void logout()} className="rounded-md border border-line p-2 dark:border-slate-700" aria-label="Logout"><LogOut size={18} /></button>
            <Link to="/profile" className="hidden text-right text-sm sm:block">
              <div className="font-semibold">{user?.fullName}</div>
              <div className="text-xs text-slate-500">{user?.role.name}</div>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
```

<a id="source-59"></a>

## frontend/src/components/rbac/Can.tsx

```tsx
import type { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface CanProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  children: ReactNode;
}

export function Can({ permission, anyPermissions, allPermissions, children }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  if (permission && !hasPermission(permission)) return null;
  if (anyPermissions && !hasAnyPermission(anyPermissions)) return null;
  if (allPermissions && !hasAllPermissions(allPermissions)) return null;
  return <>{children}</>;
}
```

<a id="source-60"></a>

## frontend/src/components/ui/Button.tsx

```tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:scale-[1.04] hover:bg-teal-800 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

<a id="source-61"></a>

## frontend/src/components/ui/Card.tsx

```tsx
import { ReactNode } from "react";

export function Card({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900 ${className}`}>{children}</section>;
}
```

<a id="source-62"></a>

## frontend/src/components/ui/Input.tsx

```tsx
import { forwardRef, InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      {...props}
      className={`h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950 ${className}`}
    />
  );
});
```

<a id="source-63"></a>

## frontend/src/components/ui/Pagination.tsx

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-slate-500">
        Showing {start}-{end} of {totalItems}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          className="h-9 bg-slate-700 px-3 hover:bg-slate-800"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          Prev
        </Button>
        <span className="min-w-24 text-center text-slate-600 dark:text-slate-300">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          type="button"
          className="h-9 bg-slate-700 px-3 hover:bg-slate-800"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
```

<a id="source-64"></a>

## frontend/src/contexts/AuthContext.tsx

```tsx
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api, setAccessToken } from "../services/api";
import type { ApiResponse, User } from "../types/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post<ApiResponse<{ accessToken: string; user: User }>>("/auth/refresh", {})
      .then((response) => {
        setAccessToken(response.data.data.accessToken);
        return api.get<ApiResponse<User>>("/auth/me");
      })
      .then((response) => {
        setUser(response.data.data);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email: string, password: string) {
      const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>("/auth/login", { email, password });
      setAccessToken(response.data.data.accessToken);
      const me = await api.get<ApiResponse<User>>("/auth/me");
      setUser(me.data.data);
      toast.success("Signed in");
    },
    async logout() {
      await api.post("/auth/logout");
      setAccessToken(null);
      setUser(null);
    },
    hasPermission(permission: string) {
      return Boolean(user?.permissions.includes(permission));
    },
    hasAnyPermission(permissions: string[]) {
      return Boolean(user && permissions.some((permission) => user.permissions.includes(permission)));
    },
    hasAllPermissions(permissions: string[]) {
      return Boolean(user && permissions.every((permission) => user.permissions.includes(permission)));
    }
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
```

<a id="source-65"></a>

## frontend/src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #111827;
  background: #f4f7fb;
}

.dark {
  color-scheme: dark;
}

@layer base {
  button:not(:disabled) {
    cursor: pointer;
    transition-duration: 200ms;
    transition-property: background-color, border-color, color, box-shadow, transform, opacity;
    transition-timing-function: ease-out;
  }

  button:not(:disabled):hover {
    background-color: #f0fdfa;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
    filter: brightness(0.98);
    transform: scale(1.03);
  }

  .dark button:not(:disabled):hover {
    background-color: #134e4a;
  }

  button:not(:disabled):active {
    transform: scale(0.97);
  }

  button:focus-visible {
    outline: 2px solid #0f766e;
    outline-offset: 2px;
  }
}

@layer components {
  .dashboard-grid {
    overflow: visible;
  }

  .dashboard-card-clickable {
    height: 100%;
  }

  .dashboard-card-zoom {
    transition-duration: 250ms;
    transition-property: box-shadow, transform;
    transition-timing-function: ease-out;
    will-change: transform;
  }

  .dashboard-card-zoom:hover {
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
    transform: translateY(-3px) scale(1.03);
  }

  .dashboard-card-zoom:active {
    transform: scale(0.98);
  }

  .dashboard-card-link {
    display: block;
    height: 100%;
    border-radius: 0.5rem;
  }

  .dashboard-card-link:focus-visible {
    outline: 2px solid #0f766e;
    outline-offset: 3px;
  }
}

@media print {
  body * {
    visibility: hidden;
  }
  .receipt-print,
  .barcode-print,
  .receipt-print * {
    visibility: visible;
  }
  .barcode-print * {
    visibility: visible;
  }
  .receipt-print {
    position: absolute;
    inset: 0 auto auto 0;
    width: 80mm;
    background: white;
    color: black;
  }
  .barcode-print {
    display: inline-block;
    width: 58mm;
    margin: 0 4mm 4mm 0;
    border: 0;
    box-shadow: none;
    break-inside: avoid;
  }
}
```

<a id="source-66"></a>

## frontend/src/lib/format.ts

```typescript
import { format } from "date-fns";

export function peso(value: number | string) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value));
}

export function manilaDate(value: string | Date, pattern = "MMMM d, yyyy") {
  return format(new Date(value), pattern);
}

export function manilaTime(value: string | Date) {
  return format(new Date(value), "h:mm a");
}
```

<a id="source-67"></a>

## frontend/src/main.tsx

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

<a id="source-68"></a>

## frontend/src/pages/AuthUtility.tsx

```tsx
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api } from "../services/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  return <Card className="mx-auto mt-12 max-w-lg"><h1 className="text-xl font-bold">Forgot password</h1><Input className="mt-4" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="employee@example.com" /><Button className="mt-4" onClick={async () => { await api.post("/auth/forgot-password", { email }); toast.success("Reset request created"); }}>Create reset token</Button></Card>;
}

export function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  return <Card className="mx-auto mt-12 max-w-lg"><h1 className="text-xl font-bold">Reset password</h1><Input className="mt-4" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Reset token" /><Input className="mt-3" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" type="password" /><Button className="mt-4" onClick={async () => { await api.post("/auth/reset-password", { token, password }); toast.success("Password reset"); }}>Reset password</Button></Card>;
}
```

<a id="source-69"></a>

## frontend/src/pages/Dashboard.tsx

```tsx
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KeyboardEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { getData } from "../services/api";
import { peso } from "../lib/format";
import { useAuth } from "../contexts/AuthContext";

interface DashboardData {
  summary: Record<string, number | string>;
  charts: { dailySales: Array<{ date: string; sales: number; profit: number }>; salesByCategory: Array<{ name: string; value: number }> };
  tables: {
    recentTransactions: Array<{ id: string; receiptNo: string; total: string }>;
    bestSellingProducts: Array<{ id: string; name: string; sku: string; quantitySold: number; revenue: number }>;
    lowStockProducts: Array<{ id: string; name: string; currentStock: number; reorderLevel: number }>;
  };
}

const summaryRoutes: Record<string, { to: string; permissions: string[] }> = {
  todaySales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  monthlySales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  yearlySales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  grossSales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  netSales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  grossProfit: { to: "/reports/profit", permissions: ["reports.profit"] },
  totalProducts: { to: "/products", permissions: ["products.view"] },
  totalCustomers: { to: "/customers", permissions: ["customers.view"] },
  totalSuppliers: { to: "/suppliers", permissions: ["suppliers.view"] },
  totalEmployees: { to: "/employees", permissions: ["users.view"] },
  inventoryValue: { to: "/reports/inventory-value", permissions: ["reports.inventory_value"] },
  lowStockProducts: { to: "/inventory/low-stock", permissions: ["inventory.view"] }
};

const summaryCardColors: Record<string, string> = {
  todaySales: "!border-teal-300 !bg-teal-200 dark:!border-teal-700 dark:!bg-teal-900",
  monthlySales: "!border-sky-300 !bg-sky-200 dark:!border-sky-700 dark:!bg-sky-900",
  yearlySales: "!border-purple-300 !bg-purple-200 dark:!border-purple-700 dark:!bg-purple-900",
  grossSales: "!border-green-300 !bg-green-200 dark:!border-green-700 dark:!bg-green-900",
  netSales: "!border-blue-300 !bg-blue-200 dark:!border-blue-700 dark:!bg-blue-900",
  grossProfit: "!border-amber-300 !bg-amber-200 dark:!border-amber-700 dark:!bg-amber-900",
  totalProducts: "!border-orange-300 !bg-orange-200 dark:!border-orange-700 dark:!bg-orange-900",
  totalCustomers: "!border-teal-300 !bg-teal-200 dark:!border-teal-700 dark:!bg-teal-900",
  totalSuppliers: "!border-slate-300 !bg-slate-200 dark:!border-slate-600 dark:!bg-slate-700",
  totalEmployees: "!border-purple-300 !bg-purple-200 dark:!border-purple-700 dark:!bg-purple-900",
  inventoryValue: "!border-green-300 !bg-green-200 dark:!border-green-700 dark:!bg-green-900",
  lowStockProducts: "!border-red-300 !bg-red-200 dark:!border-red-700 dark:!bg-red-900",
  outOfStockProducts: "!border-red-300 !bg-red-200 dark:!border-red-700 dark:!bg-red-900",
  pendingSupplierDeliveries: "!border-amber-300 !bg-amber-200 dark:!border-amber-700 dark:!bg-amber-900"
};

function labelForSummaryKey(key: string) {
  return key.replace(/[A-Z]/g, " $&");
}

function summaryValue(key: string, value: number | string) {
  return String(key).toLowerCase().includes("sales") || String(key).toLowerCase().includes("profit") || String(key).toLowerCase().includes("value") ? peso(value) : value;
}

function DashboardSummaryCard({ children, to, label, colorClass }: { children: ReactNode; to?: string; label: string; colorClass: string }) {
  const navigate = useNavigate();

  function onKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key !== " ") return;
    event.preventDefault();
    navigate(to ?? "/dashboard");
  }

  const card = (
    <Card className={`${colorClass} dashboard-card-zoom ${to ? "dashboard-card-clickable" : ""}`}>
      {children}
    </Card>
  );

  if (!to) return card;

  return (
    <Link to={to} className="dashboard-card-link focus-visible:no-underline" aria-label={`Open ${label}`} onKeyDown={onKeyDown}>
      {card}
    </Link>
  );
}

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getData<DashboardData>("/dashboard") });
  const { hasAnyPermission } = useAuth();
  if (isLoading || !data) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Card key={i} className="h-28 animate-pulse" />)}</div>;
  const summary = data.summary;
  const bestSellingProducts = data.tables.bestSellingProducts.slice(0, 3);
  return (
    <div className="space-y-6">
      <div className="dashboard-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(summary).slice(0, 12).map(([key, value]) => {
          const route = summaryRoutes[key];
          const label = labelForSummaryKey(key);
          const to = route && hasAnyPermission(route.permissions) ? route.to : undefined;
          const colorClass = summaryCardColors[key] ?? "!border-slate-300 !bg-slate-200 dark:!border-slate-600 dark:!bg-slate-700";
          return (
            <DashboardSummaryCard key={key} to={to} label={label} colorClass={colorClass}>
              <div className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-200">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{summaryValue(key, value)}</div>
            </DashboardSummaryCard>
          );
        })}
        <Card className="dashboard-card-zoom !border-indigo-300 !bg-indigo-200 dark:!border-indigo-700 dark:!bg-indigo-900 sm:col-span-2 lg:col-span-2">
          <div className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-200">Top 3 best sale products</div>
          {bestSellingProducts.length > 0 ? (
            <div className="mt-3 space-y-3">
              {bestSellingProducts.map((product, index) => (
                <div className="flex items-center justify-between gap-4 border-t border-indigo-300 pt-3 first:border-t-0 first:pt-0 dark:border-indigo-700" key={product.id}>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-950 dark:text-white" title={product.name}>{index + 1}. {product.name}</div>
                    <div className="text-xs text-slate-700 dark:text-slate-200">{product.sku}</div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <div className="font-semibold text-slate-950 dark:text-white">{product.quantitySold} sold</div>
                    <div className="text-slate-700 dark:text-slate-200">{peso(product.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">No completed sales yet</div>
          )}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-4 font-semibold">Revenue versus profit</h2><ResponsiveContainer width="100%" height={280}><LineChart data={data.charts.dailySales}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="sales" stroke="#0f766e" /><Line dataKey="profit" stroke="#c2410c" /></LineChart></ResponsiveContainer></Card>
        <Card><h2 className="mb-4 font-semibold">Sales by category</h2><ResponsiveContainer width="100%" height={280}><PieChart><Pie dataKey="value" data={data.charts.salesByCategory} fill="#0f766e" label /></PieChart></ResponsiveContainer></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-4 font-semibold">Recent transactions</h2>{data.tables.recentTransactions.map((sale) => <div className="flex justify-between border-t py-2 text-sm" key={sale.id}><span>{sale.receiptNo}</span><strong>{peso(sale.total)}</strong></div>)}</Card>
        <Card><h2 className="mb-4 font-semibold">Low-stock products</h2><ResponsiveContainer width="100%" height={240}><BarChart data={data.tables.lowStockProducts}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="currentStock" fill="#c2410c" /></BarChart></ResponsiveContainer></Card>
      </div>
    </div>
  );
}
```

<a id="source-70"></a>

## frontend/src/pages/InventoryActions.tsx

```tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api, getData } from "../services/api";
import type { Product } from "../types/api";

export function StockIn() {
  const { data: products = [] } = useQuery({ queryKey: ["products-stock-in"], queryFn: () => getData<Product[]>("/products?limit=100") });
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("0");
  return <ActionCard title="Stock-in" onSubmit={async () => { await api.post("/stock-in", { referenceNo: `SIN-${Date.now()}`, supplierId, deliveryDate: new Date().toISOString(), items: [{ productId, quantity: Number(quantity), unitCost }] }); toast.success("Stock-in completed"); }} products={products} productId={productId} setProductId={setProductId}><Input value={supplierId} onChange={(event) => setSupplierId(event.target.value)} placeholder="Supplier UUID" /><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Quantity" /><Input value={unitCost} onChange={(event) => setUnitCost(event.target.value)} placeholder="Unit cost" /></ActionCard>;
}

export function StockOut() {
  const { data: products = [] } = useQuery({ queryKey: ["products-stock-out"], queryFn: () => getData<Product[]>("/products?limit=100") });
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  return <ActionCard title="Stock-out" onSubmit={async () => { await api.post("/stock-out", { referenceNo: `SOUT-${Date.now()}`, productId, quantity: Number(quantity), reason: "Manual correction" }); toast.success("Stock-out completed"); }} products={products} productId={productId} setProductId={setProductId}><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Quantity" /></ActionCard>;
}

export function InventoryAdjustment() {
  const { data: products = [] } = useQuery({ queryKey: ["products-adjust"], queryFn: () => getData<Product[]>("/products?limit=100") });
  const [productId, setProductId] = useState("");
  const [physicalQuantity, setPhysicalQuantity] = useState("0");
  return <ActionCard title="Inventory adjustment" onSubmit={async () => { await api.post("/inventory-adjustments", { productId, physicalQuantity: Number(physicalQuantity), reason: "Physical inventory correction" }); toast.success("Adjustment recorded"); }} products={products} productId={productId} setProductId={setProductId}><Input value={physicalQuantity} onChange={(event) => setPhysicalQuantity(event.target.value)} placeholder="Physical quantity" /></ActionCard>;
}

function ActionCard(props: { title: string; products: Product[]; productId: string; setProductId: (id: string) => void; onSubmit: () => Promise<void>; children: React.ReactNode }) {
  return <Card className="mx-auto max-w-xl"><h1 className="text-xl font-bold">{props.title}</h1><select className="mt-4 h-10 w-full rounded-md border border-line px-3 text-sm" value={props.productId} onChange={(event) => props.setProductId(event.target.value)}><option value="">Select product</option>{props.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><div className="mt-3 space-y-3">{props.children}</div><Button className="mt-4" onClick={() => void props.onSubmit()}>Submit</Button></Card>;
}
```

<a id="source-71"></a>

## frontend/src/pages/Login.tsx

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AxiosError } from "axios";
import type { ApiResponse } from "../types/api";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
type FormData = z.infer<typeof schema>;

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "admin@smartstock.local", password: "Admin123!" } });
  if (user) return <Navigate to="/inventory" replace />;
  return (
    <div className="grid min-h-screen place-items-center bg-[#f4f7fb] p-4">
      <form className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft" onSubmit={handleSubmit(async (data) => {
        try {
          await login(data.email, data.password);
          navigate("/inventory");
        } catch (error) {
          const message = error instanceof AxiosError
            ? (error.response?.data as ApiResponse<unknown> | undefined)?.message ?? "Sign in failed"
            : "Sign in failed";
          setError("root", { message });
        }
      })}>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">Inventory, barcode POS, and business analytics.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Email<Input {...register("email")} type="email" className="mt-1" /></label>
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          <label className="block text-sm font-medium">Password<Input {...register("password")} type="password" className="mt-1" /></label>
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          {errors.root && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>}
          <Button disabled={isSubmitting} className="w-full"><LogIn size={18} /> Sign in</Button>
        </div>
      </form>
    </div>
  );
}
```

<a id="source-72"></a>

## frontend/src/pages/Notifications.tsx

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { api, getData } from "../services/api";

interface NotificationRow { id: string; title: string; message: string; priority: string; isRead: boolean; createdAt: string }

export function Notifications() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => getData<NotificationRow[]>("/notifications") });
  const read = useMutation({ mutationFn: (id: string) => api.post(`/notifications/${id}/read`), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
  return <div className="space-y-4"><div className="flex justify-between"><h1 className="text-2xl font-bold">Notifications</h1><Button onClick={async () => { await api.post("/notifications/mark-all-read"); await qc.invalidateQueries({ queryKey: ["notifications"] }); }}>Mark all read</Button></div>{data.map((item) => <Card key={item.id} className={item.isRead ? "opacity-70" : ""}><div className="flex justify-between gap-4"><div><div className="text-xs font-semibold uppercase text-accent">{item.priority}</div><h2 className="font-bold">{item.title}</h2><p className="text-sm text-slate-600 dark:text-slate-300">{item.message}</p></div><Button onClick={() => read.mutate(item.id)} disabled={item.isRead}>Read</Button></div></Card>)}</div>;
}
```

<a id="source-73"></a>

## frontend/src/pages/POS.tsx

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Camera, Pause, Printer, Search, Trash2, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CameraBarcodeScanner } from "../components/barcode/CameraBarcodeScanner";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api, getData } from "../services/api";
import type { ApiResponse, BarcodeLookupResult, ExternalProductDraft, Product, Sale } from "../types/api";
import { peso } from "../lib/format";

interface CartLine {
  product: Product;
  quantity: number;
  productDiscount: number;
}

interface HeldSale {
  id: string;
  notes?: string | null;
  createdAt: string;
  items: Array<{ id: string; quantity: number; discount: string; product: Product }>;
}

interface PayMongoCheckout {
  id: string;
  checkoutUrl: string;
  referenceNumber: string;
  amount: number;
}

interface PayMongoCheckoutStatus {
  id: string;
  status: string;
  paid: boolean;
}

interface PendingPayMongoCheckout {
  checkoutSessionId: string;
  amountPaid: string;
  idempotencyKey: string;
  cart: CartLine[];
}

const posCartStorageKey = "smartstock.pos.cart";
const pendingPayMongoStorageKey = "smartstock.pos.paymongo.pending";

export function POS() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState("");
  const [externalProduct, setExternalProduct] = useState<ExternalProductDraft | null>(null);
  const [isOnlineLookup, setIsOnlineLookup] = useState(false);
  const [lastScan, setLastScan] = useState<{ barcode: string; productName?: string; status: "found" | "external-found" | "not-found" | "error" } | null>(null);
  const [cart, setCart] = useState<CartLine[]>(() => {
    const storedCart = sessionStorage.getItem(posCartStorageKey);
    if (!storedCart) return [];
    try {
      return JSON.parse(storedCart) as CartLine[];
    } catch {
      return [];
    }
  });
  const [amountPaid, setAmountPaid] = useState("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const scannerBufferRef = useRef("");
  const lastScannerKeyAtRef = useRef(0);
  const activeLookupRef = useRef("");
  const processingPayMongoReturnRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products = [] } = useQuery({ queryKey: ["products-pos"], queryFn: () => getData<Product[]>("/products?limit=100") });
  const { data: heldSales = [] } = useQuery({ queryKey: ["held-sales"], queryFn: () => getData<HeldSale[]>("/held-sales") });
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => [product.name, product.sku, product.barcode].some((value) => value.toLowerCase().includes(term)));
  }, [products, search]);
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + Number(line.product.sellingPrice) * line.quantity - line.productDiscount, 0);
    return { subtotal, total: subtotal, change: Math.max(Number(amountPaid || 0) - subtotal, 0) };
  }, [amountPaid, cart]);

  const addProduct = useCallback((product: Product) => {
    setCart((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.currentStock) { toast.error(`Insufficient stock. Only ${product.currentStock} items are available.`); return lines; }
        return lines.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
      }
      if (product.currentStock < 1) { toast.error("Product is out of stock"); return lines; }
      return [...lines, { product, quantity: 1, productDiscount: 0 }];
    });
  }, []);

  function focusScanner() {
    if (document.activeElement instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    scannerInputRef.current?.focus();
  }

  const saleMutation = useMutation({
    mutationFn: async (input: { paymentMethod: "CASH" | "GCASH"; amountPaid: string; idempotencyKey: string; items: CartLine[] }) => {
      const total = input.items.reduce((sum, line) => sum + Number(line.product.sellingPrice) * line.quantity - line.productDiscount, 0);
      if (Number(input.amountPaid || 0) < total) throw new Error("Amount paid is below total");
      const response = await api.post<ApiResponse<Sale>>("/sales", {
        receiptNo: `RCP-${Date.now()}`,
        paymentMethod: input.paymentMethod,
        amountPaid: input.amountPaid,
        transactionDiscount: "0",
        idempotencyKey: input.idempotencyKey,
        items: input.items.map((line) => ({ productId: line.product.id, quantity: line.quantity, productDiscount: String(line.productDiscount) }))
      });
      return response.data.data;
    },
    onSuccess: async (sale) => {
      toast.success("Sale completed");
      setCompletedSale(sale);
      setCart([]);
      setAmountPaid("");
      sessionStorage.removeItem(posCartStorageKey);
      sessionStorage.removeItem(pendingPayMongoStorageKey);
      await queryClient.invalidateQueries({ queryKey: ["products-pos"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      const message = error instanceof AxiosError ? error.response?.data?.message : error instanceof Error ? error.message : undefined;
      toast.error(message ?? "Sale failed");
    }
  });

  const payMongoMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<PayMongoCheckout>>("/paymongo/gcash-checkout", {
        successUrl: `${window.location.origin}/pos?paymongoResult=success`,
        cancelUrl: `${window.location.origin}/pos?paymongoResult=cancelled`,
        items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity, productDiscount: String(line.productDiscount) }))
      });
      return response.data.data;
    },
    onSuccess: (checkout) => {
      const pending: PendingPayMongoCheckout = {
        checkoutSessionId: checkout.id,
        amountPaid: String(totals.total),
        idempotencyKey: crypto.randomUUID(),
        cart
      };
      sessionStorage.setItem(posCartStorageKey, JSON.stringify(cart));
      sessionStorage.setItem(pendingPayMongoStorageKey, JSON.stringify(pending));
      window.location.assign(checkout.checkoutUrl);
    },
    onError: (error) => {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message ?? "Could not start GCash checkout");
    }
  });

  const holdMutation = useMutation({
    mutationFn: async () => api.post("/held-sales", {
      notes: `Held from POS at ${new Date().toLocaleString()}`,
      items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity, productDiscount: String(line.productDiscount) }))
    }),
    onSuccess: async () => {
      toast.success("Order held");
      setCart([]);
      setAmountPaid("");
      sessionStorage.removeItem(posCartStorageKey);
      await queryClient.invalidateQueries({ queryKey: ["held-sales"] });
    },
    onError: (error) => {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message ?? "Could not hold order");
    }
  });

  const removeHeldMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/held-sales/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["held-sales"] });
    },
    onError: (error) => {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message ?? "Could not update held order");
    }
  });

  const scan = useCallback(async (barcodeValue = search) => {
    const trimmedBarcode = barcodeValue.trim().replace(/[^A-Za-z0-9._-]/g, "");
    if (!trimmedBarcode) return;
    if (activeLookupRef.current === trimmedBarcode) return;
    activeLookupRef.current = trimmedBarcode;

    try {
      const product = await getData<Product>(`/products/barcode/${encodeURIComponent(trimmedBarcode)}`);
      addProduct(product);
      setSearch("");
      setUnknownBarcode("");
      setExternalProduct(null);
      setLastScan({ barcode: trimmedBarcode, productName: product.name, status: "found" });
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      if (status === 404) {
        setIsOnlineLookup(true);
        try {
          const result = await getData<BarcodeLookupResult>(`/barcodes/lookup/${encodeURIComponent(trimmedBarcode)}`);
          if (result.success && result.source === "local") {
            addProduct(result.product);
            setSearch("");
            setUnknownBarcode("");
            setExternalProduct(null);
            setLastScan({ barcode: trimmedBarcode, productName: result.product.name, status: "found" });
            toast.success(`${result.product.name} added to cart`);
            return;
          }
          if (result.success) {
            setUnknownBarcode("");
            setExternalProduct(result.product);
            setLastScan({ barcode: trimmedBarcode, productName: result.product.name, status: "external-found" });
            toast.success("Product information found online");
            return;
          }
          setUnknownBarcode(result.barcode);
          setExternalProduct(null);
          setLastScan({ barcode: trimmedBarcode, status: "not-found" });
          toast.error(`Product not found. Barcode: ${trimmedBarcode}`);
        } catch {
          setUnknownBarcode(trimmedBarcode);
          setExternalProduct(null);
          setLastScan({ barcode: trimmedBarcode, status: "error" });
          toast.error("Online product lookup is currently unavailable. You can still add this product manually.");
        } finally {
          setIsOnlineLookup(false);
        }
        return;
      }
      setLastScan({ barcode: trimmedBarcode, status: "error" });
      toast.error("Barcode lookup failed. Check the network or API server.");
    } finally {
      activeLookupRef.current = "";
      setTimeout(focusScanner, 0);
    }
  }, [addProduct, search]);

  function reviewExternalProduct(product: ExternalProductDraft) {
    const params = new URLSearchParams({
      barcode: product.barcode,
      name: product.name,
      description: product.description ?? "",
      imageUrl: product.image ?? "",
      unit: product.size ?? "pcs",
      importedSource: product.source,
      returnTo: "pos",
      addToCartAfterSave: "1"
    });
    sessionStorage.setItem(posCartStorageKey, JSON.stringify(cart));
    navigate(`/products?${params.toString()}`);
  }

  function addManualProduct(barcode: string) {
    const params = new URLSearchParams({ barcode, returnTo: "pos", addToCartAfterSave: "1" });
    sessionStorage.setItem(posCartStorageKey, JSON.stringify(cart));
    navigate(`/products?${params.toString()}`);
  }

  function resumeHeldSale(heldSale: HeldSale) {
    setCart(heldSale.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      productDiscount: Number(item.discount)
    })));
    setAmountPaid("");
    removeHeldMutation.mutate(heldSale.id);
    toast.success("Held order resumed");
  }

  function checkoutCash() {
    saleMutation.mutate({ paymentMethod: "CASH", amountPaid, idempotencyKey: crypto.randomUUID(), items: cart });
  }

  function checkoutGcash() {
    if (cart.length === 0) return;
    payMongoMutation.mutate();
  }

  const handleCameraScan = useCallback((scannedBarcode: string) => {
    setSearch(scannedBarcode);
    void scan(scannedBarcode);
  }, [scan]);

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    }

    function handleScannerKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || isEditableTarget(event.target)) return;

      const now = Date.now();
      if (now - lastScannerKeyAtRef.current > 80) scannerBufferRef.current = "";
      lastScannerKeyAtRef.current = now;

      if (event.key === "Enter") {
        const scannedValue = scannerBufferRef.current;
        scannerBufferRef.current = "";
        if (scannedValue.length >= 3) {
          event.preventDefault();
          void scan(scannedValue);
        }
        return;
      }

      if (event.key.length === 1) scannerBufferRef.current += event.key;
    }

    window.addEventListener("keydown", handleScannerKey);
    return () => window.removeEventListener("keydown", handleScannerKey);
  }, [scan]);

  useEffect(() => {
    sessionStorage.setItem(posCartStorageKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const barcode = searchParams.get("addBarcode");
    if (!barcode) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("addBarcode");
    setSearchParams(nextParams, { replace: true });
    void scan(barcode);
  }, [scan, searchParams, setSearchParams]);

  useEffect(() => {
    const result = searchParams.get("paymongoResult");
    if (!result || processingPayMongoReturnRef.current) return;
    processingPayMongoReturnRef.current = true;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("paymongoResult");
    setSearchParams(nextParams, { replace: true });

    if (result === "cancelled") {
      toast.error("GCash payment was cancelled.");
      processingPayMongoReturnRef.current = false;
      return;
    }

    const stored = sessionStorage.getItem(pendingPayMongoStorageKey);
    if (!stored) {
      toast.error("Could not find the pending GCash checkout.");
      processingPayMongoReturnRef.current = false;
      return;
    }
    const storedCheckout = stored;

    async function verifyPayment() {
      try {
        const pending = JSON.parse(storedCheckout) as PendingPayMongoCheckout;
        const status = await getData<PayMongoCheckoutStatus>(`/paymongo/checkout-sessions/${encodeURIComponent(pending.checkoutSessionId)}`);
        if (!status.paid) {
          toast.error("GCash payment is not paid yet.");
          return;
        }
        setCart(pending.cart);
        saleMutation.mutate({ paymentMethod: "GCASH", amountPaid: pending.amountPaid, idempotencyKey: pending.idempotencyKey, items: pending.cart });
      } catch (error) {
        const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
        toast.error(message ?? "Could not verify GCash payment.");
      } finally {
        processingPayMongoReturnRef.current = false;
      }
    }

    void verifyPayment();
  }, [searchParams, setSearchParams, saleMutation]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_460px]">
      <div className="space-y-4">
        <Card>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Search size={18} /> Scan or Search Product</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input ref={scannerInputRef} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void scan(); }} placeholder="Scan barcode or search product..." autoFocus />
            <div className="flex gap-2">
              <Button type="button" className="flex-1 sm:flex-none" disabled={isOnlineLookup} onClick={() => void scan()}><Search size={18} /> Lookup</Button>
              <Button type="button" className="flex-1 bg-slate-700 hover:bg-slate-800 sm:flex-none" onClick={() => setIsCameraOpen((isOpen) => !isOpen)}><Camera size={18} /> Camera</Button>
            </div>
          </div>
          {isOnlineLookup && <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">Searching online product database...</div>}
          {externalProduct && (
            <div className="mt-3 grid gap-3 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-950 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center">
              {externalProduct.image ? <img className="h-24 w-24 rounded-md border border-teal-100 object-contain" src={externalProduct.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="hidden sm:block" />}
              <div>
                <div className="font-semibold">Product information found.</div>
                <div className="mt-1 font-semibold">{externalProduct.name}</div>
                {externalProduct.brand && <div>Brand: {externalProduct.brand}</div>}
                <div className="text-xs uppercase tracking-wide text-teal-700">Source: {externalProduct.source === "upcitemdb" ? "UPCitemdb" : "Open Food Facts"}</div>
              </div>
              <Button type="button" onClick={() => reviewExternalProduct(externalProduct)}>Review & Add Product</Button>
            </div>
          )}
          {unknownBarcode && (
            <div className="mt-3 flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
              <span>Product not found in the local database or online product databases. Barcode: <strong>{unknownBarcode}</strong></span>
              <Button type="button" className="bg-amber-700 hover:bg-amber-800" onClick={() => addManualProduct(unknownBarcode)}>Add Product Manually</Button>
            </div>
          )}
          {lastScan && (
            <div className={`mt-3 rounded-md border p-3 text-sm ${lastScan.status === "found" ? "border-teal-200 bg-teal-50 text-teal-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              Last scan: <strong>{lastScan.barcode}</strong>{lastScan.productName ? ` - ${lastScan.productName} added to cart` : ""}
            </div>
          )}
          {isCameraOpen && <div className="mt-3 max-w-md"><CameraBarcodeScanner compact continuous onClose={() => setIsCameraOpen(false)} onScan={handleCameraScan} /></div>}
        </Card>
        <Card>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => <button key={product.id} className="rounded-md border border-line p-3 text-left hover:border-brand disabled:cursor-not-allowed disabled:opacity-50" disabled={product.currentStock < 1} onClick={() => addProduct(product)}><div className="font-semibold">{product.name}</div><div className="text-sm text-slate-500">{product.sku} | {product.barcode}</div><div className="mt-2 flex justify-between text-sm"><span>{peso(product.sellingPrice)}</span><span>{product.currentStock} {product.unit}</span></div></button>)}
          </div>
        </Card>
      </div>
      <Card className="self-start">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Current Order</h1>
          <Button type="button" className="h-9 bg-slate-700 px-3 hover:bg-slate-800" disabled={cart.length === 0} onClick={() => setCart([])}><X size={16} /> Clear</Button>
        </div>
        <div className="mt-4 space-y-2">
          {cart.length === 0 && <p className="text-sm text-slate-500">No items in cart.</p>}
          {cart.map((line) => <div key={line.product.id} className="grid grid-cols-[1fr_72px_72px_28px] items-center gap-2 rounded-md border border-line p-3 text-sm"><div><strong className="block">{line.product.name}</strong><span className="text-xs text-slate-500">{line.product.barcode}</span></div><span className="text-right">{peso(line.product.sellingPrice)}</span><Input className="h-8 text-center" min="1" max={line.product.currentStock} type="number" value={line.quantity} onChange={(event) => setCart((rows) => rows.map((row) => row.product.id === line.product.id ? { ...row, quantity: Math.min(line.product.currentStock, Math.max(1, Number(event.target.value || 1))) } : row))} /><button onClick={() => setCart((rows) => rows.filter((row) => row.product.id !== line.product.id))} aria-label={`Remove ${line.product.name}`}><Trash2 size={16} /></button><span className="col-span-4 text-right font-semibold">{peso(Number(line.product.sellingPrice) * line.quantity - line.productDiscount)}</span></div>)}
        </div>
        {heldSales.length > 0 && (
          <div className="mt-5 space-y-2 border-t pt-4">
            <h2 className="text-sm font-semibold">Held Orders</h2>
            {heldSales.map((heldSale) => (
              <div key={heldSale.id} className="flex items-center justify-between gap-3 rounded-md border border-line p-3 text-sm dark:border-slate-700">
                <div>
                  <div className="font-semibold">{heldSale.items.length} item{heldSale.items.length === 1 ? "" : "s"}</div>
                  <div className="text-xs text-slate-500">{new Date(heldSale.createdAt).toLocaleString()}</div>
                </div>
                <Button type="button" className="h-8 bg-slate-700 px-3 text-xs hover:bg-slate-800" disabled={removeHeldMutation.isPending} onClick={() => resumeHeldSale(heldSale)}>Resume</Button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><strong>{peso(totals.subtotal)}</strong></div><div className="flex justify-between"><span>Discount</span><strong>{peso(0)}</strong></div><div className="flex justify-between text-lg"><span>Grand Total</span><strong>{peso(totals.total)}</strong></div><Input value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} placeholder="Amount received for cash" /><div className="flex justify-between"><span>Change</span><strong>{peso(totals.change)}</strong></div><div className="grid gap-2"><Button type="button" className="bg-slate-700 hover:bg-slate-800" disabled={cart.length === 0 || holdMutation.isPending} onClick={() => holdMutation.mutate()}><Pause size={18} /> {holdMutation.isPending ? "Holding..." : "Hold Order"}</Button><Button type="button" className="bg-emerald-700 hover:bg-emerald-800" disabled={cart.length === 0 || payMongoMutation.isPending || saleMutation.isPending} onClick={checkoutGcash}><Wallet size={18} /> {payMongoMutation.isPending ? "Opening GCash..." : "Pay with GCash"}</Button><Button disabled={cart.length === 0 || saleMutation.isPending || Number(amountPaid || 0) < totals.total} onClick={checkoutCash}><Printer size={18} /> {saleMutation.isPending ? "Processing..." : "Cash Checkout / Pay"}</Button></div></div>
      </Card>
      {completedSale && <ReceiptDialog sale={completedSale} onClose={() => setCompletedSale(null)} />}
    </div>
  );
}

function ReceiptDialog({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Receipt</h2>
          <button type="button" className="rounded-md border border-line p-2 dark:border-slate-700" onClick={onClose} aria-label="Close receipt"><X size={18} /></button>
        </div>
        <div className="receipt-print rounded-md border border-line bg-white p-4 font-mono text-xs text-slate-950 shadow-sm">
          <div className="text-center">
            <div className="text-sm font-bold">SmartStock Demo Store</div>
            <div>Sales Receipt</div>
          </div>
          <div className="my-3 border-t border-dashed border-slate-400" />
          <div className="space-y-1">
            <div className="flex justify-between gap-3"><span>Receipt</span><span>{sale.receiptNo}</span></div>
            <div className="flex justify-between gap-3"><span>Date</span><span>{new Date(sale.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between gap-3"><span>Cashier</span><span>{sale.cashier?.fullName ?? "-"}</span></div>
            <div className="flex justify-between gap-3"><span>Payment</span><span>{sale.paymentMethod}</span></div>
          </div>
          <div className="my-3 border-t border-dashed border-slate-400" />
          <div className="space-y-2">
            {sale.items.map((item) => (
              <div key={item.id}>
                <div className="font-semibold">{item.product.name}</div>
                <div className="flex justify-between gap-3">
                  <span>{item.quantity} x {peso(item.sellingPrice)}</span>
                  <span>{peso(item.lineTotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="my-3 border-t border-dashed border-slate-400" />
          <div className="space-y-1">
            <div className="flex justify-between gap-3 text-sm font-bold"><span>Total</span><span>{peso(sale.total)}</span></div>
            <div className="flex justify-between gap-3"><span>Amount paid</span><span>{peso(sale.amountPaid)}</span></div>
            <div className="flex justify-between gap-3"><span>Change</span><span>{peso(sale.change)}</span></div>
          </div>
          <div className="mt-4 text-center">Thank you</div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={onClose}>Close</Button>
          <Button type="button" onClick={() => window.print()}><Printer size={16} /> Print Receipt</Button>
        </div>
      </div>
    </div>
  );
}
```

<a id="source-74"></a>

## frontend/src/pages/ProfileSettings.tsx

```tsx
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { api } from "../services/api";

export function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  return (
    <Card className="max-w-xl">
      <h1 className="text-xl font-bold">{user?.fullName}</h1>
      <p className="text-sm text-slate-500">{user?.email} . {user?.role.name}</p>
      <div className="mt-6 space-y-3">
        <Input type="password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        <Input type="password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <Button onClick={async () => { await api.post("/auth/change-password", { currentPassword, newPassword }); toast.success("Password changed"); }}>Change password</Button>
      </div>
    </Card>
  );
}

export function SettingsPage() {
  return <Card><h1 className="text-xl font-bold">Settings</h1><p className="mt-2 text-sm text-slate-500">Business currency is Philippine peso (PHP), timezone Asia/Manila, date format MMMM d, yyyy, and time format h:mm a.</p></Card>;
}
```

<a id="source-75"></a>

## frontend/src/pages/Reports.tsx

```tsx
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { getData } from "../services/api";
import { peso } from "../lib/format";
import { exportReportCsv, exportReportExcel, exportReportPdf, ReportData } from "../services/reportExporters";

export const reports = [
  { slug: "daily-sales", title: "Daily Sales", description: "Transactions, items sold, net sales, COGS, profit, and average transaction value." },
  { slug: "monthly-sales", title: "Monthly Sales", description: "Sales per day, best sellers, category totals, payment methods, and employee sales." },
  { slug: "yearly-sales", title: "Yearly Sales", description: "Annual revenue, annual profit, monthly performance, and year comparison." },
  { slug: "products", title: "Product Sales", description: "Best-selling, least-selling, fast-moving, and slow-moving product summaries." },
  { slug: "categories", title: "Category Sales", description: "Quantity sold, gross sales, cost, profit, and margin by category." },
  { slug: "employees", title: "Employee Sales", description: "Transaction count, items sold, discounts, refunds, net sales, and average ticket." },
  { slug: "payments", title: "Payment Methods", description: "Collections by cash, GCash, Maya, bank transfer, cards, credit, and mixed payments." },
  { slug: "profit", title: "Profit Analysis", description: "Gross profit and profit margin by product, category, employee, day, month, and year." },
  { slug: "inventory-value", title: "Inventory Value", description: "Inventory cost, expected selling value, potential profit, category, and supplier value." },
  { slug: "supplier-performance", title: "Supplier Performance", description: "Completed deliveries, on-time rate, return rate, purchase value, and score." },
  { slug: "forecast", title: "Sales Forecast", description: "Three-month moving-average sales forecast and suggested reorder demand." }
];

export function ReportsIndex() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-slate-500">Sales, profit, inventory, supplier, payment, and forecast reports.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.slug} to={`/reports/${report.slug}`}>
            <Card className="h-full transition hover:border-brand">
              <h2 className="font-bold">{report.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ReportDetail() {
  const { type = "daily-sales" } = useParams();
  const reportMeta = reports.find((report) => report.slug === type);
  const [searchParams] = useSearchParams();
  const [exporting, setExporting] = useState<"csv" | "excel" | "pdf" | null>(null);
  const queryString = searchParams.toString();
  const reportUrl = queryString ? `/reports/${type}?${queryString}` : `/reports/${type}`;
  const { data, isLoading } = useQuery({ queryKey: ["report", type, queryString], queryFn: () => getData<ReportData>(reportUrl) });

  async function exportReport(format: "csv" | "excel" | "pdf") {
    if (!data) return;
    setExporting(format);
    try {
      if (format === "csv") exportReportCsv(data);
      if (format === "excel") await exportReportExcel(data);
      if (format === "pdf") exportReportPdf(data);
      toast.success("Report exported successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Report export failed.");
    } finally {
      setExporting(null);
    }
  }

  if (isLoading || !data) return <Card className="h-40 animate-pulse" />;

  const metrics = data.summary.slice(0, 6).map((item) => [
    item.label,
    item.type === "currency" ? peso(item.value) : item.type === "percent" ? `${Number(item.value).toFixed(2)}%` : item.value
  ]);
  const exportDisabled = Boolean(exporting);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{reportMeta?.title ?? data.report}</h1>
          <p className="text-sm text-slate-500">{reportMeta?.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={exportDisabled} onClick={() => void exportReport("csv")} className="bg-slate-700"><Download size={16} /> {exporting === "csv" ? "Generating..." : "CSV"}</Button>
          <Button disabled={exportDisabled} onClick={() => void exportReport("excel")} className="bg-emerald-700 hover:bg-emerald-800"><FileSpreadsheet size={16} /> {exporting === "excel" ? "Generating..." : "Excel"}</Button>
          <Button disabled={exportDisabled} onClick={() => void exportReport("pdf")} className="bg-accent"><FileText size={16} /> {exporting === "pdf" ? "Generating..." : "PDF"}</Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([label, value]) => <Card key={label}><div className="text-xs uppercase text-slate-500">{label}</div><div className="mt-2 text-2xl font-bold">{value}</div></Card>)}
      </div>
      <Card>
        <h2 className="mb-4 font-semibold">Report details</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b text-xs uppercase text-slate-500">{data.columns.map((column) => <th key={column.key} className="py-3 pr-4">{column.label}</th>)}</tr></thead>
            <tbody>
              {data.rows.length === 0 && <tr><td className="py-6 text-slate-500" colSpan={data.columns.length}>No data is available for the selected reporting period.</td></tr>}
              {data.rows.slice(0, 100).map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  {data.columns.map((column) => (
                    <td key={column.key} className="py-3 pr-4">
                      {column.type === "currency" ? peso(row[column.key] ?? 0) : column.type === "percent" ? `${Number(row[column.key] ?? 0).toFixed(2)}%` : String(row[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
```

<a id="source-76"></a>

## frontend/src/pages/ResourcePage.tsx

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import jsPDF from "jspdf";
import { Archive, Barcode, Camera, Download, FileText, Hash, Pencil, Plus, Printer, RotateCcw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BarcodeLabel } from "../components/barcode/BarcodeLabel";
import { CameraBarcodeScanner } from "../components/barcode/CameraBarcodeScanner";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Pagination } from "../components/ui/Pagination";
import { api, getData } from "../services/api";
import { Can } from "../components/rbac/Can";

interface ResourcePageProps {
  title: string;
  endpoint: string;
  columns: string[];
  showCreate?: boolean;
}

type Row = Record<string, unknown>;

interface ProductFormState {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  primarySupplierId: string;
  description: string;
  costPrice: string;
  sellingPrice: string;
  currentStock: string;
  reorderLevel: string;
  unit: string;
  imageUrl: string;
  tracksExpiration: boolean;
}

interface SupplierFormState {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  deliveryLeadTime: string;
  status: "ACTIVE" | "ARCHIVED";
  notes: string;
}

type GenericFormState = Record<string, string>;

interface GenericField {
  key: string;
  placeholder: string;
  type?: string;
  optionsSource?: "products" | "roles" | "suppliers";
  options?: Array<{ value: string; label: string }>;
  className?: string;
  required?: boolean;
  createOnly?: boolean;
}

interface GenericResourceConfig {
  endpoint: string;
  label: string;
  permission: string;
  fields: GenericField[];
  empty: GenericFormState;
  allowCreate?: boolean;
  invalidatePrefixes?: string[];
}

const emptyProductForm: ProductFormState = {
  name: "",
  sku: "",
  barcode: "",
  categoryId: "",
  primarySupplierId: "",
  description: "",
  costPrice: "",
  sellingPrice: "",
  currentStock: "0",
  reorderLevel: "0",
  unit: "pcs",
  imageUrl: "",
  tracksExpiration: false
};

const emptySupplierForm: SupplierFormState = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  paymentTerms: "",
  deliveryLeadTime: "",
  status: "ACTIVE",
  notes: ""
};

const pageSize = 10;

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("name" in value && typeof value.name === "string") return value.name;
    if ("fullName" in value && typeof value.fullName === "string") return value.fullName;
    return "";
  }
  return String(value);
}

function filename(title: string, extension: "csv" | "pdf") {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "export"}.${extension}`;
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function ean13CheckDigit(firstTwelveDigits: string) {
  const sum = [...firstTwelveDigits].reduce((total, digit, index) => {
    return total + Number(digit) * (index % 2 === 0 ? 1 : 3);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

function generateProductBarcode() {
  const firstTwelveDigits = `20${Date.now().toString().slice(-10)}`;
  return `${firstTwelveDigits}${ean13CheckDigit(firstTwelveDigits)}`;
}

function generateSkuFromBarcode(barcode: string) {
  return `SKU-${barcode.replace(/[^A-Za-z0-9]+/g, "").slice(-12) || Date.now()}`;
}

function resourcePermissionPrefix(title: string) {
  const firstWord = title.toLowerCase().split(" ")[0];
  if (firstWord === "product" || firstWord === "products") return "products";
  if (firstWord === "employee" || firstWord === "employees") return "users";
  if (firstWord === "stock") return "inventory";
  return firstWord;
}

function getGenericResourceConfig(endpoint: string, title: string): GenericResourceConfig | null {
  if (endpoint === "/categories" || endpoint.startsWith("/categories?")) {
    return {
      endpoint: "/categories",
      label: "Category",
      permission: "categories",
      empty: { name: "", description: "", status: "ACTIVE" },
      fields: [
        { key: "name", placeholder: "Category name", required: true },
        { key: "description", placeholder: "Description", className: "md:col-span-2" },
        { key: "status", placeholder: "Status", options: [{ value: "ACTIVE", label: "Active" }, { value: "ARCHIVED", label: "Archived" }] }
      ]
    };
  }

  if (endpoint === "/customers" || endpoint.startsWith("/customers?")) {
    return {
      endpoint: "/customers",
      label: "Customer",
      permission: "customers",
      empty: {
        fullName: "",
        phone: "",
        email: "",
        customerType: "Walk-in",
        loyaltyPoints: "0",
        creditBalance: "0",
        birthday: "",
        status: "ACTIVE",
        address: "",
        notes: ""
      },
      fields: [
        { key: "fullName", placeholder: "Customer name", required: true },
        { key: "phone", placeholder: "Phone" },
        { key: "email", placeholder: "Email", type: "email" },
        {
          key: "customerType",
          placeholder: "Customer type",
          options: [
            { value: "Walk-in", label: "Walk-in" },
            { value: "Regular", label: "Regular" },
            { value: "Member", label: "Member" },
            { value: "Wholesale", label: "Wholesale" }
          ]
        },
        { key: "loyaltyPoints", placeholder: "Loyalty points", type: "number" },
        { key: "creditBalance", placeholder: "Credit balance", type: "number" },
        { key: "birthday", placeholder: "Birthday", type: "date" },
        { key: "status", placeholder: "Status", options: [{ value: "ACTIVE", label: "Active" }, { value: "ARCHIVED", label: "Archived" }] },
        { key: "address", placeholder: "Address", className: "md:col-span-2" },
        { key: "notes", placeholder: "Notes", className: "md:col-span-3" }
      ]
    };
  }

  if (endpoint === "/users" || endpoint.startsWith("/users?")) {
    return {
      endpoint: "/users",
      label: title.toLowerCase().startsWith("employee") ? "Employee" : "User",
      permission: "users",
      empty: { fullName: "", email: "", phone: "", roleId: "", status: "ACTIVE", password: "" },
      fields: [
        { key: "fullName", placeholder: "Full name", required: true },
        { key: "email", placeholder: "Email", type: "email", required: true },
        { key: "phone", placeholder: "Phone" },
        { key: "roleId", placeholder: "Role", required: true, createOnly: true, optionsSource: "roles" },
        { key: "status", placeholder: "Status", options: [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }] },
        { key: "password", placeholder: "Temporary password", type: "password", required: true, createOnly: true }
      ]
    };
  }

  if (endpoint === "/supplier-products" || endpoint.startsWith("/supplier-products?")) {
    return {
      endpoint: "/supplier-products",
      label: "Supplier product",
      permission: "suppliers",
      allowCreate: false,
      invalidatePrefixes: ["/supplier-products", "/suppliers", "/products"],
      empty: { supplierId: "", productId: "" },
      fields: [
        { key: "supplierId", placeholder: "Supplier", required: true, optionsSource: "suppliers" },
        { key: "productId", placeholder: "Product", required: true, optionsSource: "products" }
      ]
    };
  }

  return null;
}

export function ResourcePage({ title, endpoint, columns, showCreate = true }: ResourcePageProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showGenericForm, setShowGenericForm] = useState(false);
  const [showBarcodeCamera, setShowBarcodeCamera] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Row | null>(null);
  const [labelQuantity, setLabelQuantity] = useState("1");
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [genericForm, setGenericForm] = useState<GenericFormState>({});
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingGenericId, setEditingGenericId] = useState<string | null>(null);
  const [editingOriginalBarcode, setEditingOriginalBarcode] = useState("");
  const [importedSource, setImportedSource] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: [endpoint], queryFn: () => getData<Row[]>(endpoint) });
  const productList = endpoint.startsWith("/products");
  const supplierList = endpoint === "/suppliers" || endpoint.startsWith("/suppliers?");
  const genericConfig = getGenericResourceConfig(endpoint, title);
  const genericList = Boolean(genericConfig);
  const archivedList = productList && endpoint.toLowerCase().includes("status=archived");
  const activeProductList = productList && !archivedList;
  const editingSupplierProduct = genericConfig?.endpoint === "/supplier-products" && showGenericForm;
  const { data: categories = [] } = useQuery({ queryKey: ["/categories"], queryFn: () => getData<Row[]>("/categories"), enabled: activeProductList && showProductForm });
  const { data: suppliers = [] } = useQuery({ queryKey: ["/suppliers"], queryFn: () => getData<Row[]>("/suppliers"), enabled: (activeProductList && showProductForm) || editingSupplierProduct });
  const { data: productOptions = [] } = useQuery({ queryKey: ["/products?limit=100"], queryFn: () => getData<Row[]>("/products?limit=100"), enabled: editingSupplierProduct });
  const { data: roles = [] } = useQuery({ queryKey: ["/roles"], queryFn: () => getData<Row[]>("/roles"), enabled: genericConfig?.endpoint === "/users" && showGenericForm });
  const statusColumn = columns.includes("status");
  const showProductArchiveActions = productList && statusColumn;
  const showBarcodeActions = productList || title.toLowerCase().startsWith("barcode");
  const showSupplierActions = supplierList;
  const showGenericActions = genericList;
  const showRowActions = showProductArchiveActions || showBarcodeActions || showSupplierActions || showGenericActions;
  const createProduct = useMutation({
    mutationFn: async (payload: ProductFormState) => api.post("/products", {
      name: payload.name.trim(),
      sku: payload.sku.trim(),
      barcode: payload.barcode.trim(),
      categoryId: payload.categoryId,
      primarySupplierId: payload.primarySupplierId || null,
      description: payload.description.trim() || undefined,
      imageUrl: payload.imageUrl.trim() || undefined,
      costPrice: payload.costPrice,
      sellingPrice: payload.sellingPrice,
      currentStock: Number(payload.currentStock),
      reorderLevel: Number(payload.reorderLevel),
      unit: payload.unit.trim() || "pcs",
      tracksExpiration: payload.tracksExpiration,
      status: "ACTIVE"
    }),
    onSuccess: (_response, payload) => {
      toast.success("Product added");
      setProductForm(emptyProductForm);
      setImportedSource("");
      setShowProductForm(false);
      setShowBarcodeCamera(false);
      if (searchParams.get("returnTo") === "pos" && searchParams.get("addToCartAfterSave") === "1") {
        navigate(`/pos?addBarcode=${encodeURIComponent(payload.barcode.trim())}`);
        return;
      }
      if (searchParams.has("barcode")) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("barcode");
        nextParams.delete("name");
        nextParams.delete("description");
        nextParams.delete("imageUrl");
        nextParams.delete("unit");
        nextParams.delete("importedSource");
        nextParams.delete("returnTo");
        nextParams.delete("addToCartAfterSave");
        setSearchParams(nextParams, { replace: true });
      }
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && ["/products", "/supplier-products"].some((prefix) => key.startsWith(prefix));
        }
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Product create failed")
  });
  const updateProduct = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProductFormState }) => api.put(`/products/${id}`, {
      name: payload.name.trim(),
      sku: payload.sku.trim(),
      barcode: payload.barcode.trim(),
      categoryId: payload.categoryId,
      primarySupplierId: payload.primarySupplierId || null,
      description: payload.description.trim() || undefined,
      imageUrl: payload.imageUrl.trim() || undefined,
      costPrice: payload.costPrice,
      sellingPrice: payload.sellingPrice,
      currentStock: Number(payload.currentStock),
      reorderLevel: Number(payload.reorderLevel),
      unit: payload.unit.trim() || "pcs",
      tracksExpiration: payload.tracksExpiration,
      status: "ACTIVE"
    }),
    onSuccess: () => {
      toast.success("Product updated");
      setProductForm(emptyProductForm);
      setEditingProductId(null);
      setEditingOriginalBarcode("");
      setImportedSource("");
      setShowProductForm(false);
      setShowBarcodeCamera(false);
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && ["/products", "/supplier-products", "/inventory"].some((prefix) => key.startsWith(prefix));
        }
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Product update failed")
  });
  const createSupplier = useMutation({
    mutationFn: async (payload: SupplierFormState) => api.post("/suppliers", supplierPayload(payload)),
    onSuccess: () => {
      toast.success("Supplier added");
      closeSupplierForm();
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/suppliers");
        }
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Supplier create failed")
  });
  const updateSupplier = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: SupplierFormState }) => api.put(`/suppliers/${id}`, supplierPayload(payload)),
    onSuccess: () => {
      toast.success("Supplier updated");
      closeSupplierForm();
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && ["/suppliers", "/supplier-products", "/products"].some((prefix) => key.startsWith(prefix));
        }
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Supplier update failed")
  });
  const createGeneric = useMutation({
    mutationFn: async () => {
      if (!genericConfig) throw new Error("Unsupported resource");
      return api.post(genericConfig.endpoint, genericPayload(genericConfig, genericForm, false));
    },
    onSuccess: () => {
      toast.success(`${genericConfig?.label ?? "Record"} added`);
      closeGenericForm();
      invalidateGenericQueries();
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Create failed")
  });
  const updateGeneric = useMutation({
    mutationFn: async () => {
      if (!genericConfig || !editingGenericId) throw new Error("Unsupported resource");
      return api.put(`${genericConfig.endpoint}/${editingGenericId}`, genericPayload(genericConfig, genericForm, true));
    },
    onSuccess: () => {
      toast.success(`${genericConfig?.label ?? "Record"} updated`);
      closeGenericForm();
      invalidateGenericQueries();
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Update failed")
  });
  const productStatusAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "archive" | "restore" }) => api.post(`/products/${id}/${action}`),
    onSuccess: (_response, variables) => {
      toast.success(variables.action === "archive" ? "Product archived" : "Product restored");
      void queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/products")
      });
    },
    onError: () => toast.error("Product status update failed")
  });
  const rows = useMemo(() => data.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [data, search]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, rows]);
  const resource = resourcePermissionPrefix(title);
  const canOpenCreateForm = activeProductList || supplierList || genericList;
  const colSpan = columns.length + (showRowActions ? 1 : 0);

  useEffect(() => {
    setPage(1);
  }, [endpoint, search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    const barcodeParam = searchParams.get("barcode");
    if (!activeProductList || !barcodeParam) return;
    const nameParam = searchParams.get("name") ?? "";
    const descriptionParam = searchParams.get("description") ?? "";
    const imageUrlParam = searchParams.get("imageUrl") ?? "";
    const unitParam = searchParams.get("unit") ?? "";
    const sourceParam = searchParams.get("importedSource") ?? "";
    setImportedSource(sourceParam);
    setProductForm((current) => ({
      ...current,
      barcode: barcodeParam,
      name: nameParam || current.name,
      sku: current.sku || generateSkuFromBarcode(barcodeParam),
      description: descriptionParam || current.description,
      imageUrl: imageUrlParam || current.imageUrl,
      unit: unitParam || current.unit
    }));
    setShowProductForm(true);
  }, [activeProductList, searchParams]);

  function openProductForm() {
    closeSupplierForm();
    closeGenericForm();
    setEditingProductId(null);
    setEditingOriginalBarcode("");
    setProductForm((current) => ({ ...current, sku: current.sku || generateSkuFromBarcode(current.barcode) }));
    setShowProductForm(true);
  }

  function openSupplierForm() {
    closeProductForm();
    closeGenericForm();
    setEditingSupplierId(null);
    setSupplierForm(emptySupplierForm);
    setShowSupplierForm(true);
  }

  function openGenericForm() {
    if (!genericConfig) return;
    closeProductForm();
    closeSupplierForm();
    setEditingGenericId(null);
    setGenericForm(genericConfig.empty);
    setShowGenericForm(true);
  }

  function supplierPayload(payload: SupplierFormState) {
    return {
      name: payload.name.trim(),
      contactPerson: payload.contactPerson.trim() || undefined,
      phone: payload.phone.trim() || undefined,
      email: payload.email.trim(),
      address: payload.address.trim() || undefined,
      paymentTerms: payload.paymentTerms.trim() || undefined,
      deliveryLeadTime: payload.deliveryLeadTime === "" ? undefined : Number(payload.deliveryLeadTime),
      status: payload.status,
      notes: payload.notes.trim() || undefined
    };
  }

  function productFormFromRow(row: Row): ProductFormState {
    const category = row.category && typeof row.category === "object" ? row.category as Row : null;
    const primarySupplier = row.primarySupplier && typeof row.primarySupplier === "object" ? row.primarySupplier as Row : null;
    return {
      name: text(row.name),
      sku: text(row.sku),
      barcode: text(row.barcode),
      categoryId: text(row.categoryId) || text(category?.id),
      primarySupplierId: text(row.primarySupplierId) || text(primarySupplier?.id),
      description: text(row.description),
      costPrice: text(row.costPrice),
      sellingPrice: text(row.sellingPrice),
      currentStock: text(row.currentStock) || "0",
      reorderLevel: text(row.reorderLevel) || "0",
      unit: text(row.unit) || "pcs",
      imageUrl: text(row.imageUrl),
      tracksExpiration: Boolean(row.tracksExpiration)
    };
  }

  function openEditProductForm(row: Row) {
    const rowId = typeof row.id === "string" ? row.id : "";
    if (!rowId) return;
    closeSupplierForm();
    closeGenericForm();
    const nextForm = productFormFromRow(row);
    setEditingProductId(rowId);
    setEditingOriginalBarcode(nextForm.barcode);
    setProductForm(nextForm);
    setImportedSource("");
    setShowBarcodeCamera(false);
    setShowProductForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditSupplierForm(row: Row) {
    const rowId = typeof row.id === "string" ? row.id : "";
    if (!rowId) return;
    closeProductForm();
    closeGenericForm();
    setEditingSupplierId(rowId);
    setSupplierForm({
      name: text(row.name),
      contactPerson: text(row.contactPerson),
      phone: text(row.phone),
      email: text(row.email),
      address: text(row.address),
      paymentTerms: text(row.paymentTerms),
      deliveryLeadTime: text(row.deliveryLeadTime),
      status: text(row.status) === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
      notes: text(row.notes)
    });
    setShowSupplierForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditGenericForm(row: Row) {
    if (!genericConfig) return;
    const rowId = typeof row.id === "string" ? row.id : "";
    if (!rowId) return;
    closeProductForm();
    closeSupplierForm();
    setEditingGenericId(rowId);
    const nextForm = { ...genericConfig.empty };
    genericConfig.fields.forEach((field) => {
      if (field.key === "roleId") {
        const role = row.role && typeof row.role === "object" ? row.role as Row : null;
        nextForm.roleId = text(row.roleId) || text(role?.id);
        return;
      }
      if (field.createOnly) return;
      nextForm[field.key] = text(row[field.key]);
    });
    setGenericForm(nextForm);
    setShowGenericForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateProductForm<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setProductForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "barcode" && !current.sku && typeof value === "string") {
        next.sku = generateSkuFromBarcode(value);
      }
      return next;
    });
  }

  function updateSupplierForm<K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) {
    setSupplierForm((current) => ({ ...current, [key]: value }));
  }

  function updateGenericForm(key: string, value: string) {
    setGenericForm((current) => ({ ...current, [key]: value }));
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productForm.categoryId) {
      toast.error("Category is required");
      return;
    }
    if (!editingProductId || productForm.barcode.trim() !== editingOriginalBarcode) {
      try {
        await getData(`/barcodes/${encodeURIComponent(productForm.barcode.trim())}`);
        toast.error("Barcode already belongs to another product");
        return;
      } catch (error) {
        const status = error instanceof AxiosError ? error.response?.status : undefined;
        if (status && status !== 404) {
          toast.error("Could not validate barcode");
          return;
        }
      }
    }
    if (editingProductId) {
      updateProduct.mutate({ id: editingProductId, payload: { ...productForm, sku: productForm.sku.trim() || generateSkuFromBarcode(productForm.barcode) } });
      return;
    }
    createProduct.mutate({ ...productForm, sku: productForm.sku.trim() || generateSkuFromBarcode(productForm.barcode) });
  }

  function submitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingSupplierId) {
      updateSupplier.mutate({ id: editingSupplierId, payload: supplierForm });
      return;
    }
    createSupplier.mutate(supplierForm);
  }

  function submitGeneric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingGenericId) {
      updateGeneric.mutate();
      return;
    }
    createGeneric.mutate();
  }

  function closeProductForm() {
    setShowProductForm(false);
    setShowBarcodeCamera(false);
    setEditingProductId(null);
    setEditingOriginalBarcode("");
    setProductForm(emptyProductForm);
    setImportedSource("");
    if (!searchParams.has("barcode")) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("barcode");
    nextParams.delete("name");
    nextParams.delete("description");
    nextParams.delete("imageUrl");
    nextParams.delete("unit");
    nextParams.delete("importedSource");
    nextParams.delete("returnTo");
    nextParams.delete("addToCartAfterSave");
    setSearchParams(nextParams, { replace: true });
  }

  function closeSupplierForm() {
    setShowSupplierForm(false);
    setEditingSupplierId(null);
    setSupplierForm(emptySupplierForm);
  }

  function closeGenericForm() {
    setShowGenericForm(false);
    setEditingGenericId(null);
    setGenericForm({});
  }

  function invalidateGenericQueries() {
    if (!genericConfig) return;
    void queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        const prefixes = genericConfig.invalidatePrefixes ?? [genericConfig.endpoint];
        return typeof key === "string" && prefixes.some((prefix) => key.startsWith(prefix));
      }
    });
  }

  function genericPayload(config: GenericResourceConfig, form: GenericFormState, editing: boolean) {
    const payload: Record<string, string | number | undefined> = {};
    config.fields.forEach((field) => {
      if (editing && field.createOnly) return;
      const value = form[field.key]?.trim() ?? "";
      if (value === "" && !field.required) return;
      payload[field.key] = field.type === "number" ? Number(value) : value;
    });
    return payload;
  }

  function printBarcodeLabels() {
    window.print();
  }

  function exportCsv() {
    if (rows.length === 0) {
      toast.error("No records to export");
      return;
    }
    const csvRows = [
      columns.map(csvCell).join(","),
      ...rows.map((row) => columns.map((column) => csvCell(text(row[column]))).join(","))
    ];
    const blob = new Blob([`\uFEFF${csvRows.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename(title, "csv");
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (rows.length === 0) {
      toast.error("No records to export");
      return;
    }
    const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const columnWidth = (pageWidth - margin * 2) / columns.length;
    let y = 18;

    doc.setFontSize(14);
    doc.text(title, margin, y);
    y += 10;
    doc.setFontSize(8);
    doc.text(`${rows.length} records exported ${new Date().toLocaleString()}`, margin, y);
    y += 10;

    function drawHeader() {
      doc.setFont("helvetica", "bold");
      columns.forEach((column, index) => doc.text(column, margin + index * columnWidth, y, { maxWidth: columnWidth - 2 }));
      doc.setFont("helvetica", "normal");
      y += 8;
    }

    drawHeader();
    rows.forEach((row) => {
      if (y > pageHeight - 16) {
        doc.addPage();
        y = 18;
        drawHeader();
      }
      columns.forEach((column, index) => {
        doc.text(text(row[column]) || "-", margin + index * columnWidth, y, { maxWidth: columnWidth - 2 });
      });
      y += 7;
    });
    doc.save(filename(title, "pdf"));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-slate-500">{rows.length} records</p></div>
        <div className="flex gap-2">
          {showProductArchiveActions && <Link to={archivedList ? "/products" : "/products/archive"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"><Archive size={16} /> {archivedList ? "Active" : "Archive"}</Link>}
          {showCreate && canOpenCreateForm && (!productList || activeProductList) && (!genericConfig || genericConfig.allowCreate !== false) && <Can permission={`${resource}.create`}><Button onClick={activeProductList ? openProductForm : supplierList ? openSupplierForm : openGenericForm}><Plus size={16} /> Add</Button></Can>}
          <Can anyPermissions={[`${resource}.export`, "reports.export"]}><Button onClick={exportCsv} disabled={isLoading} className="bg-slate-700"><Download size={16} /> CSV</Button></Can>
          <Can anyPermissions={[`${resource}.export`, "reports.export"]}><Button onClick={exportPdf} disabled={isLoading} className="bg-accent"><FileText size={16} /> PDF</Button></Can>
        </div>
      </div>
      {showProductForm && (
        <Card>
          <form className="space-y-4" onSubmit={submitProduct}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{editingProductId ? "Edit product" : "Add product"}</h2>
              <button type="button" className="rounded-md border border-line p-2 dark:border-slate-700" onClick={closeProductForm} aria-label="Close product form"><X size={18} /></button>
            </div>
            {importedSource && (
              <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
                Product details were imported from {importedSource === "upcitemdb" ? "UPCitemdb" : "Open Food Facts"}. Review and edit them before saving. Price, cost, stock, supplier, and local category still need your local values.
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <Input required placeholder="Product name" value={productForm.name} onChange={(event) => updateProductForm("name", event.target.value)} />
                {importedSource && <span className="text-xs text-teal-700">Imported from external API</span>}
              </label>
              <div className="flex gap-2">
                <Input placeholder="SKU" value={productForm.sku} onChange={(event) => updateProductForm("sku", event.target.value)} />
                <Button type="button" className="shrink-0 bg-slate-700 px-3 hover:bg-slate-800" onClick={() => updateProductForm("sku", generateSkuFromBarcode(productForm.barcode))}><Hash size={16} /> Generate</Button>
              </div>
              <div className="flex gap-2">
                <Input required placeholder="Barcode" value={productForm.barcode} onChange={(event) => updateProductForm("barcode", event.target.value)} />
                <Button type="button" className="shrink-0 bg-slate-700 px-3 hover:bg-slate-800" onClick={() => updateProductForm("barcode", generateProductBarcode())}><Barcode size={16} /> Generate</Button>
                <Button type="button" className="shrink-0 bg-slate-700 px-3 hover:bg-slate-800" onClick={() => setShowBarcodeCamera((isOpen) => !isOpen)}><Camera size={16} /> Scan</Button>
              </div>
              <select required className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" value={productForm.categoryId} onChange={(event) => updateProductForm("categoryId", event.target.value)}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={String(category.id)} value={String(category.id)}>{text(category.name)}</option>)}
              </select>
              <select className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" value={productForm.primarySupplierId} onChange={(event) => updateProductForm("primarySupplierId", event.target.value)}>
                <option value="">No supplier</option>
                {suppliers.map((supplier) => <option key={String(supplier.id)} value={String(supplier.id)}>{text(supplier.name)}</option>)}
              </select>
              <Input placeholder="Unit" value={productForm.unit} onChange={(event) => updateProductForm("unit", event.target.value)} />
              <label className="space-y-1">
                <Input placeholder="Product image URL" value={productForm.imageUrl} onChange={(event) => updateProductForm("imageUrl", event.target.value)} />
                {importedSource && productForm.imageUrl && <span className="text-xs text-teal-700">Imported image URL</span>}
              </label>
              <Input required min="0" step="0.01" type="number" placeholder="Cost price" value={productForm.costPrice} onChange={(event) => updateProductForm("costPrice", event.target.value)} />
              <Input required min="0" step="0.01" type="number" placeholder="Selling price" value={productForm.sellingPrice} onChange={(event) => updateProductForm("sellingPrice", event.target.value)} />
              <Input required min="0" step="1" type="number" placeholder="Current stock" value={productForm.currentStock} onChange={(event) => updateProductForm("currentStock", event.target.value)} />
              <Input required min="0" step="1" type="number" placeholder="Reorder level" value={productForm.reorderLevel} onChange={(event) => updateProductForm("reorderLevel", event.target.value)} />
              <label className="flex h-10 items-center gap-2 rounded-md border border-line px-3 text-sm dark:border-slate-700">
                <input type="checkbox" checked={productForm.tracksExpiration} onChange={(event) => updateProductForm("tracksExpiration", event.target.checked)} />
                Tracks expiration
              </label>
              <label className="space-y-1 md:col-span-3">
                <Input placeholder="Description" value={productForm.description} onChange={(event) => updateProductForm("description", event.target.value)} />
                {importedSource && productForm.description && <span className="text-xs text-teal-700">Imported from external API</span>}
              </label>
            </div>
            {productForm.imageUrl && (
              <div className="flex items-center gap-3 rounded-md border border-line p-3 text-sm dark:border-slate-700">
                <img className="h-20 w-20 rounded-md object-contain" src={productForm.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                <span className="text-slate-600 dark:text-slate-300">Product image preview</span>
              </div>
            )}
            {showBarcodeCamera && <CameraBarcodeScanner onClose={() => setShowBarcodeCamera(false)} onScan={(scannedBarcode) => { updateProductForm("barcode", scannedBarcode); setShowBarcodeCamera(false); }} />}
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-end">
              <BarcodeLabel value={productForm.barcode} productName={productForm.name || "New product"} price={productForm.sellingPrice ? `PHP ${Number(productForm.sellingPrice).toFixed(2)}` : undefined} />
              <Input min="1" step="1" type="number" placeholder="Labels" value={labelQuantity} onChange={(event) => setLabelQuantity(event.target.value)} />
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" disabled={!productForm.barcode.trim()} onClick={printBarcodeLabels}><Printer size={16} /> Print barcode</Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={closeProductForm}>Cancel</Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>{createProduct.isPending || updateProduct.isPending ? "Saving..." : editingProductId ? "Update product" : "Save product"}</Button>
            </div>
          </form>
        </Card>
      )}
      {showSupplierForm && (
        <Card>
          <form className="space-y-4" onSubmit={submitSupplier}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{editingSupplierId ? "Edit supplier" : "Add supplier"}</h2>
              <button type="button" className="rounded-md border border-line p-2 dark:border-slate-700" onClick={closeSupplierForm} aria-label="Close supplier form"><X size={18} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input required placeholder="Supplier name" value={supplierForm.name} onChange={(event) => updateSupplierForm("name", event.target.value)} />
              <Input placeholder="Contact person" value={supplierForm.contactPerson} onChange={(event) => updateSupplierForm("contactPerson", event.target.value)} />
              <Input placeholder="Phone" value={supplierForm.phone} onChange={(event) => updateSupplierForm("phone", event.target.value)} />
              <Input type="email" placeholder="Email" value={supplierForm.email} onChange={(event) => updateSupplierForm("email", event.target.value)} />
              <Input placeholder="Payment terms" value={supplierForm.paymentTerms} onChange={(event) => updateSupplierForm("paymentTerms", event.target.value)} />
              <Input min="0" step="1" type="number" placeholder="Delivery lead time" value={supplierForm.deliveryLeadTime} onChange={(event) => updateSupplierForm("deliveryLeadTime", event.target.value)} />
              <select className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" value={supplierForm.status} onChange={(event) => updateSupplierForm("status", event.target.value as SupplierFormState["status"])}>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <Input className="md:col-span-2" placeholder="Address" value={supplierForm.address} onChange={(event) => updateSupplierForm("address", event.target.value)} />
              <Input className="md:col-span-3" placeholder="Notes" value={supplierForm.notes} onChange={(event) => updateSupplierForm("notes", event.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={closeSupplierForm}>Cancel</Button>
              <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>{createSupplier.isPending || updateSupplier.isPending ? "Saving..." : editingSupplierId ? "Update supplier" : "Save supplier"}</Button>
            </div>
          </form>
        </Card>
      )}
      {showGenericForm && genericConfig && (
        <Card>
          <form className="space-y-4" onSubmit={submitGeneric}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{editingGenericId ? `Edit ${genericConfig.label.toLowerCase()}` : `Add ${genericConfig.label.toLowerCase()}`}</h2>
              <button type="button" className="rounded-md border border-line p-2 dark:border-slate-700" onClick={closeGenericForm} aria-label="Close edit form"><X size={18} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {genericConfig.fields.filter((field) => !field.createOnly || !editingGenericId).map((field) => {
                const sourcedOptions = field.optionsSource === "roles"
                  ? roles.map((role) => ({ value: text(role.id), label: text(role.name) }))
                  : field.optionsSource === "suppliers"
                    ? suppliers.map((supplier) => ({ value: text(supplier.id), label: text(supplier.name) }))
                    : field.optionsSource === "products"
                      ? productOptions.map((product) => ({ value: text(product.id), label: `${text(product.name)}${text(product.sku) ? ` (${text(product.sku)})` : ""}` }))
                      : undefined;
                const options = sourcedOptions ?? field.options;
                if (options) {
                  return (
                    <select key={field.key} required={field.required} className={`${field.className ?? ""} h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950`} value={genericForm[field.key] ?? ""} onChange={(event) => updateGenericForm(field.key, event.target.value)}>
                      <option value="">{field.placeholder}</option>
                      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  );
                }
                return <Input key={field.key} required={field.required} className={field.className} type={field.type ?? "text"} placeholder={field.placeholder} value={genericForm[field.key] ?? ""} onChange={(event) => updateGenericForm(field.key, event.target.value)} />;
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={closeGenericForm}>Cancel</Button>
              <Button type="submit" disabled={createGeneric.isPending || updateGeneric.isPending}>{createGeneric.isPending || updateGeneric.isPending ? "Saving..." : editingGenericId ? `Update ${genericConfig.label.toLowerCase()}` : `Save ${genericConfig.label.toLowerCase()}`}</Button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        <div className="mb-4 flex items-center gap-2"><Search size={18} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b text-xs uppercase text-slate-500">{columns.map((column) => <th className="py-3 pr-4" key={column}>{column}</th>)}{showRowActions && <th className="py-3 pr-4">actions</th>}</tr></thead>
            <tbody>
              {isLoading && <tr><td className="py-6 text-slate-500" colSpan={colSpan}>Loading...</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td className="py-6 text-slate-500" colSpan={colSpan}>No records found.</td></tr>}
              {paginatedRows.map((row) => {
                const rowId = typeof row.id === "string" ? row.id : "";
                const rowArchived = text(row.status) === "ARCHIVED";
                return (
                  <tr className="border-b last:border-0" key={String(row.id ?? JSON.stringify(row))}>
                    {columns.map((column) => <td className="py-3 pr-4" key={column}>{text(row[column])}</td>)}
                    {showRowActions && (
                      <td className="space-y-2 py-3 pr-4">
                        {activeProductList && <Can permission="products.update"><Button className="h-8 bg-brand px-3 text-xs" disabled={!rowId} onClick={() => openEditProductForm(row)}><Pencil size={14} /> Edit</Button></Can>}
                        {showSupplierActions && <Can permission="suppliers.update"><Button className="h-8 bg-brand px-3 text-xs" disabled={!rowId} onClick={() => openEditSupplierForm(row)}><Pencil size={14} /> Edit</Button></Can>}
                        {showGenericActions && genericConfig && <Can permission={`${genericConfig.permission}.update`}><Button className="h-8 bg-brand px-3 text-xs" disabled={!rowId} onClick={() => openEditGenericForm(row)}><Pencil size={14} /> Edit</Button></Can>}
                        {showBarcodeActions && <Button className="h-8 bg-slate-700 px-3 text-xs hover:bg-slate-800" disabled={!text(row.barcode)} onClick={() => setSelectedBarcodeProduct(row)}><Barcode size={14} /> Barcode</Button>}
                        {rowArchived ? (
                          <Can permission="products.restore"><Button className="h-8 bg-teal-700 px-3 text-xs" disabled={!rowId || productStatusAction.isPending} onClick={() => productStatusAction.mutate({ id: rowId, action: "restore" })}><RotateCcw size={14} /> Restore</Button></Can>
                        ) : (
                          <Can permission="products.archive"><Button className="h-8 bg-slate-700 px-3 text-xs hover:bg-slate-800" disabled={!rowId || productStatusAction.isPending} onClick={() => productStatusAction.mutate({ id: rowId, action: "archive" })}><Archive size={14} /> Archive</Button></Can>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && rows.length > 0 && (
          <Pagination currentPage={page} pageSize={pageSize} totalItems={rows.length} onPageChange={setPage} />
        )}
      </Card>
      {selectedBarcodeProduct && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Product barcode</h2>
              <button type="button" className="rounded-md border border-line p-2 dark:border-slate-700" onClick={() => setSelectedBarcodeProduct(null)} aria-label="Close barcode preview"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {Array.from({ length: Math.max(1, Number(labelQuantity || 1)) }).map((_, index) => (
                <BarcodeLabel
                  key={index}
                  value={text(selectedBarcodeProduct.barcode)}
                  productName={text(selectedBarcodeProduct.name)}
                  price={text(selectedBarcodeProduct.sellingPrice) ? `PHP ${Number(text(selectedBarcodeProduct.sellingPrice)).toFixed(2)}` : undefined}
                />
              ))}
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input min="1" step="1" type="number" placeholder="Number of labels" value={labelQuantity} onChange={(event) => setLabelQuantity(event.target.value)} />
                <Button type="button" onClick={printBarcodeLabels}><Printer size={16} /> Print labels</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

<a id="source-77"></a>

## frontend/src/pages/RoleManagement.tsx

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Can } from "../components/rbac/Can";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api, getData } from "../services/api";

interface Permission {
  id: string;
  key: string;
  name: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  rolePermissions: Array<{ permission: Permission }>;
  _count?: { users: number };
}

export function RoleManagement() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: () => getData<Role[]>("/roles") });
  const { data: grouped = {} } = useQuery({ queryKey: ["permissions", "grouped"], queryFn: () => getData<Record<string, Permission[]>>("/permissions/grouped") });
  const selected = useMemo(() => roles.find((role) => role.id === selectedId) ?? roles[0], [roles, selectedId]);

  function loadRole(role: Role) {
    setSelectedId(role.id);
    setName(role.name);
    setDescription(role.description ?? "");
    setSelectedKeys(new Set(role.rolePermissions.map((row) => row.permission.key)));
  }

  const saveRole = useMutation({
    mutationFn: async () => {
      if (selected) {
        await api.patch(`/roles/${selected.id}`, { name, description });
        await api.put(`/roles/${selected.id}/permissions`, { permissionKeys: [...selectedKeys] });
        return;
      }
      const created = await api.post<{ data: Role }>("/roles", { name, description });
      await api.put(`/roles/${created.data.data.id}/permissions`, { permissionKeys: [...selectedKeys] });
    },
    onSuccess: async () => {
      toast.success("Role saved");
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    }
  });

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => api.delete(`/roles/${roleId}`),
    onSuccess: async () => {
      toast.success("Role deleted");
      setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    }
  });

  useEffect(() => {
    if (selected && selected.id !== selectedId) loadRole(selected);
  }, [selected, selectedId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Roles</h1>
          <Can permission="roles.create"><Button onClick={() => { setSelectedId(null); setName(""); setDescription(""); setSelectedKeys(new Set()); }}>New</Button></Can>
        </div>
        {roles.map((role) => (
          <button key={role.id} onClick={() => loadRole(role)} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${selected?.id === role.id ? "bg-teal-50 text-brand dark:bg-teal-950" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
            <span>{role.name}</span>
            <span className="text-xs text-slate-500">{role._count?.users ?? 0}</span>
          </button>
        ))}
      </Card>
      <Card className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold"><ShieldCheck size={20} /> Role Management</h2>
            <p className="text-sm text-slate-500">{selected?.isSystem ? "System role" : "Custom role"}</p>
          </div>
          <div className="flex gap-2">
            <Can permission="roles.delete">{selected && !selected.isSystem && <Button className="bg-red-600 hover:bg-red-700" onClick={() => deleteRole.mutate(selected.id)}><Trash2 size={16} /> Delete</Button>}</Can>
            <Can anyPermissions={["roles.update", "roles.assign_permissions"]}><Button onClick={() => saveRole.mutate()} disabled={saveRole.isPending}><Save size={16} /> Save</Button></Can>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Role name" />
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" />
        </div>
        <div className="space-y-4">
          {Object.entries(grouped).map(([module, permissions]) => {
            const everySelected = permissions.every((permission) => selectedKeys.has(permission.key));
            return (
              <section key={module} className="border-t border-line pt-4 dark:border-slate-700">
                <label className="mb-3 flex items-center gap-2 text-sm font-bold capitalize">
                  <input type="checkbox" checked={everySelected} onChange={(event) => {
                    const next = new Set(selectedKeys);
                    permissions.forEach((permission) => event.target.checked ? next.add(permission.key) : next.delete(permission.key));
                    setSelectedKeys(next);
                  }} />
                  {module}
                </label>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {permissions.map((permission) => (
                    <label key={permission.key} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm dark:border-slate-700">
                  <input type="checkbox" checked={selectedKeys.has(permission.key)} onChange={(event) => {
                    const next = new Set(selectedKeys);
                    if (event.target.checked) next.add(permission.key);
                    else next.delete(permission.key);
                    setSelectedKeys(next);
                  }} />
                      {permission.key}
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
```

<a id="source-78"></a>

## frontend/src/pages/Unauthorized.tsx

```tsx
import { Link } from "react-router-dom";

export function Unauthorized() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-lg border border-line bg-white p-6 text-center shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">403 Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have permission to view this page.</p>
        <Link to="/dashboard" className="mt-4 inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white">Dashboard</Link>
      </div>
    </div>
  );
}
```

<a id="source-79"></a>

## frontend/src/routes/ProtectedRoute.tsx

```tsx
import { Navigate, Outlet } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
}

export function ProtectedRoute({ permission, anyPermissions, allPermissions }: ProtectedRouteProps) {
  const { user, loading, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/unauthorized" replace />;
  if (anyPermissions && !hasAnyPermission(anyPermissions)) return <Navigate to="/unauthorized" replace />;
  if (allPermissions && !hasAllPermissions(allPermissions)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export function PermissionRoute({ children, permission, anyPermissions, allPermissions }: PropsWithChildren<ProtectedRouteProps>) {
  const { user, loading, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/unauthorized" replace />;
  if (anyPermissions && !hasAnyPermission(anyPermissions)) return <Navigate to="/unauthorized" replace />;
  if (allPermissions && !hasAllPermissions(allPermissions)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
```

<a id="source-80"></a>

## frontend/src/services/api.ts

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "../types/api";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({ baseURL, withCredentials: true });

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original.headers?.["x-retried"]) {
      original.headers = original.headers ?? {};
      original.headers["x-retried"] = "true";
      const refreshed = await axios.post<ApiResponse<{ accessToken: string }>>(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
      setAccessToken(refreshed.data.data.accessToken);
      original.headers.Authorization = `Bearer ${refreshed.data.data.accessToken}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export async function getData<T>(url: string) {
  const response = await api.get<ApiResponse<T>>(url);
  return response.data.data;
}
```

<a id="source-81"></a>

## frontend/src/services/reportExporters.ts

```typescript
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import { peso } from "../lib/format";

export type ReportValueType = "text" | "number" | "currency" | "percent" | "date" | "datetime" | "time";

export interface ReportColumn {
  key: string;
  label: string;
  type?: ReportValueType;
}

export interface ReportSection {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
}

export interface ReportData {
  report: string;
  title: string;
  period: string;
  generatedAt: string;
  generatedBy: string;
  business: { name: string; address: string; contactNumber: string; email: string; logoUrl?: string };
  summary: Array<{ label: string; value: string | number; type?: ReportValueType }>;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  sections: ReportSection[];
}

function filename(report: ReportData, extension: "csv" | "xlsx" | "pdf") {
  const date = new Date(report.generatedAt).toISOString().slice(0, 10);
  const title = report.title.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]+/g, "");
  return `${title}_${date}.${extension}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function rawValue(value: string | number | undefined) {
  if (value === undefined || value === null) return "";
  return value;
}

function displayValue(value: string | number | undefined, type?: ReportValueType) {
  if (value === undefined || value === null || value === "") return "";
  if (type === "currency") return peso(value);
  if (type === "percent") return `${Number(value).toFixed(2)}%`;
  return String(value);
}

function csvCell(value: string | number | undefined, type?: ReportValueType) {
  const cell = type === "currency" || type === "number" || type === "percent" ? rawValue(value) : displayValue(value, type);
  return `"${String(cell).replace(/"/g, '""')}"`;
}

export function exportReportCsv(report: ReportData) {
  if (report.rows.length === 0 && report.summary.length === 0) throw new Error("No data is available for the selected reporting period.");
  const rows = [
    ["Report", report.title],
    ["Report Period", report.period],
    ["Generated On", new Date(report.generatedAt).toLocaleString()],
    ["Generated By", report.generatedBy],
    [],
    ["Summary"],
    ["Metric", "Value"],
    ...report.summary.map((item) => [item.label, rawValue(item.value)]),
    [],
    report.columns.map((column) => column.label),
    ...report.rows.map((row) => report.columns.map((column) => csvCell(row[column.key], column.type)))
  ];
  const csv = rows.map((row) => row.map((cell) => typeof cell === "string" && cell.startsWith("\"") ? cell : csvCell(cell)).join(",")).join("\n");
  download(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), filename(report, "csv"));
}

function applyExcelFormat(cell: ExcelJS.Cell, type?: ReportValueType) {
  if (type === "currency") cell.numFmt = '"PHP" #,##0.00';
  if (type === "percent") {
    cell.value = Number(cell.value ?? 0) / 100;
    cell.numFmt = "0.00%";
  }
  if (type === "number") cell.numFmt = "#,##0";
}

function addExcelTable(worksheet: ExcelJS.Worksheet, title: string, columns: ReportColumn[], rows: Record<string, string | number>[]) {
  worksheet.addRow([]);
  worksheet.addRow([title]).font = { bold: true };
  const header = worksheet.addRow(columns.map((column) => column.label));
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });
  for (const row of rows) {
    const excelRow = worksheet.addRow(columns.map((column) => rawValue(row[column.key])));
    excelRow.eachCell((cell, index) => {
      applyExcelFormat(cell, columns[index - 1]?.type);
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
  }
}

export async function exportReportExcel(report: ReportData) {
  if (report.rows.length === 0 && report.summary.length === 0) throw new Error("No data is available for the selected reporting period.");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SmartStock";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet(report.title.slice(0, 31));
  worksheet.views = [{ state: "frozen", ySplit: 8 }];

  worksheet.addRow([report.business.name]).font = { bold: true, size: 16 };
  worksheet.addRow([report.title]).font = { bold: true, size: 14 };
  worksheet.addRow(["Report Period", report.period]);
  worksheet.addRow(["Generated On", new Date(report.generatedAt).toLocaleString()]);
  worksheet.addRow(["Generated By", report.generatedBy]);
  worksheet.addRow([]);
  worksheet.addRow(["Summary"]).font = { bold: true };

  for (const item of report.summary) {
    const row = worksheet.addRow([item.label, rawValue(item.value)]);
    row.getCell(1).font = { bold: true };
    applyExcelFormat(row.getCell(2), item.type);
  }

  addExcelTable(worksheet, "Details", report.columns, report.rows);
  for (const item of report.sections) addExcelTable(worksheet, item.title, item.columns, item.rows);

  worksheet.columns.forEach((column) => {
    const values = column.values?.slice(1).map((value) => String(value ?? "")) ?? [];
    column.width = Math.min(Math.max(...values.map((value) => value.length), 12) + 2, 36);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  download(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename(report, "xlsx"));
}

function drawTable(doc: jsPDF, columns: ReportColumn[], rows: Record<string, string | number>[], y: number, margin: number, usableWidth: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const columnWidth = usableWidth / columns.length;

  function header() {
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, y - 5, usableWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    columns.forEach((column, index) => doc.text(column.label, margin + index * columnWidth + 1, y, { maxWidth: columnWidth - 2 }));
    y += 7;
    doc.setFont("helvetica", "normal");
  }

  header();
  for (const row of rows) {
    if (y > pageHeight - 24) {
      doc.addPage();
      y = margin;
      header();
    }
    columns.forEach((column, index) => doc.text(displayValue(row[column.key], column.type) || "-", margin + index * columnWidth + 1, y, { maxWidth: columnWidth - 2 }));
    y += 7;
  }
  return y;
}

export function exportReportPdf(report: ReportData) {
  if (report.rows.length === 0 && report.summary.length === 0) throw new Error("No data is available for the selected reporting period.");
  const landscape = report.columns.length > 7;
  const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin * 2;
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(report.business.name, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  [report.business.address, report.business.contactNumber, report.business.email].filter(Boolean).forEach((line) => {
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(report.title.toUpperCase(), margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Report Period: ${report.period}`, margin, y);
  y += 5;
  doc.text(`Generated On: ${new Date(report.generatedAt).toLocaleString()}`, margin, y);
  y += 5;
  doc.text(`Generated By: ${report.generatedBy}`, margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("EXECUTIVE SUMMARY", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const half = usableWidth / 2;
  report.summary.forEach((item, index) => {
    const x = margin + (index % 2) * half;
    if (index > 0 && index % 2 === 0) y += 5;
    doc.text(`${item.label}: ${displayValue(item.value, item.type)}`, x, y, { maxWidth: half - 4 });
  });
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("DETAILS", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  y = drawTable(doc, report.columns, report.rows, y, margin, usableWidth);

  for (const pageNumber of Array.from({ length: doc.getNumberOfPages() }, (_, index) => index + 1)) {
    doc.setPage(pageNumber);
    doc.setFontSize(8);
    doc.text(`Page ${pageNumber} of ${doc.getNumberOfPages()}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, { align: "right" });
    doc.text("System Generated Report", margin, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(filename(report, "pdf"));
}
```

<a id="source-82"></a>

## frontend/src/types/api.ts

```typescript
export type RoleName = "ADMIN" | "MANAGER" | "CASHIER" | "INVENTORY_STAFF";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: { id: string; name: string };
  roleName?: string;
  permissions: string[];
  status?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description?: string | null;
  costPrice: string;
  sellingPrice: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  imageUrl?: string | null;
  status: string;
  category?: { id: string; name: string };
  primarySupplier?: { id: string; name: string } | null;
}

export interface ExternalProductDraft {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  image?: string;
  manufacturer?: string;
  size?: string;
  source: "upcitemdb" | "openfoodfacts";
  importedFields: string[];
}

export type BarcodeLookupResult =
  | { success: true; source: "local"; exists_locally: true; product: Product }
  | { success: true; source: "upcitemdb" | "openfoodfacts"; exists_locally: false; product: ExternalProductDraft }
  | { success: false; source: "none"; exists_locally: false; barcode: string; message: string };

export interface SaleItem {
  id: string;
  product: Product;
  quantity: number;
  sellingPrice: string;
  historicalCost: string;
  lineTotal: string;
}

export interface Sale {
  id: string;
  receiptNo: string;
  total: string;
  amountPaid: string;
  change: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  cashier?: User;
  customer?: { fullName: string } | null;
  items: SaleItem[];
}
```

<a id="source-83"></a>

## frontend/src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />
```

<a id="source-84"></a>

## frontend/tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        line: "#d7dde6",
        brand: "#0f766e",
        accent: "#c2410c"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
```

<a id="source-85"></a>

## frontend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

<a id="source-86"></a>

## frontend/vite.config.ts

```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:5000"
    }
  }
});
```

<a id="source-87"></a>

## package.json

```json
{
  "name": "smartstock",
  "private": true,
  "version": "1.0.0",
  "description": "SmartStock Inventory and Sales Management System",
  "scripts": {
    "install:all": "npm install --prefix backend && npm install --prefix frontend",
    "dev:reset": "powershell -ExecutionPolicy Bypass -File scripts/reset-dev-ports.ps1",
    "dev": "npm run dev:reset && concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\"",
    "build": "npm run build --prefix backend && npm run build --prefix frontend",
    "lint": "npm run lint --prefix backend && npm run lint --prefix frontend",
    "typecheck": "npm run typecheck --prefix backend && npm run typecheck --prefix frontend"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

<a id="source-88"></a>

## scripts/reset-dev-ports.ps1

```powershell
$ErrorActionPreference = "Stop"

$ports = @(5000, 5173)
$connections = Get-NetTCPConnection -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort -and $_.State -eq "Listen" }

$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

if (-not $processIds) {
  Write-Host "No dev servers are listening on ports 5000 or 5173."
  exit 0
}

foreach ($processId in $processIds) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if (-not $process) {
    continue
  }

  Write-Host "Stopping $($process.ProcessName) process $processId on SmartStock dev port."
  Stop-Process -Id $processId -Force
}

```
