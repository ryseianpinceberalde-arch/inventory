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
