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
    ["Grace Velasco", "admin@smartstock.local", "Admin123!", RoleName.ADMIN],
    ["Rafael Dela Cruz", "manager@smartstock.local", "Manager123!", RoleName.MANAGER],
    ["Mika Santiago", "cashier@smartstock.local", "Cashier123!", RoleName.CASHIER],
    ["Ethan Romero", "cashier2@smartstock.local", "Cashier123!", RoleName.CASHIER],
    ["Noel Bautista", "inventory@smartstock.local", "Inventory123!", RoleName.INVENTORY_STAFF]
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
  const supplierNames = [
    "Metro Manila Beverage Supply",
    "Luzon Snack Distributors",
    "Prime Canned Goods Trading",
    "Everyday Personal Care Supply",
    "South Metro Household Goods",
    "FreshMart Wholesale Center",
    "Islandwide Consumer Products",
    "Golden Basket Trading",
    "Sunrise Retail Distributors",
    "Cityline General Merchandise"
  ];
  const contactNames = ["Maria Santos", "Jose Reyes", "Angela Cruz", "Miguel Ramos", "Leah Garcia", "Daniel Lim", "Sofia Mendoza", "Carlo Bautista", "Nina Flores", "Paolo Navarro"];
  const supplierLocations = ["Quezon City", "Manila", "Pasig City", "Makati City", "Parañaque City", "Taguig City", "Caloocan City", "Mandaluyong City", "Marikina City", "Las Piñas City"];
  for (let i = 1; i <= 10; i += 1) {
    await prisma.supplier.upsert({
      where: { id: supplierIds[i - 1] },
      update: {
        name: supplierNames[i - 1],
        contactPerson: contactNames[i - 1],
        phone: `091700000${String(i).padStart(2, "0")}`,
        email: `supplier${i}@example.com`,
        address: `${supplierLocations[i - 1]}, Metro Manila`,
        notes: "Demo supplier for sample inventory data"
      },
      create: {
        id: supplierIds[i - 1],
        name: supplierNames[i - 1],
        contactPerson: contactNames[i - 1],
        phone: `091700000${String(i).padStart(2, "0")}`,
        email: `supplier${i}@example.com`,
        address: `${supplierLocations[i - 1]}, Metro Manila`,
        paymentTerms: "Net 30",
        deliveryLeadTime: 3 + (i % 5),
        notes: "Demo supplier for sample inventory data"
      }
    });
  }
  const supplierRows = await prisma.supplier.findMany({ where: { id: { in: supplierIds } }, orderBy: { id: "asc" } });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@smartstock.local" } });
  const cashier = await prisma.user.findUniqueOrThrow({ where: { email: "cashier@smartstock.local" } });

  log("Creating products...");
  const demoProducts = [
    { name: "Coca-Cola Original 1.5 L", category: "Beverages" },
    { name: "Pepsi Cola 1.5 L", category: "Beverages" },
    { name: "Wilkins Distilled Water 1 L", category: "Beverages" },
    { name: "Nescafe Classic Coffee 100 g", category: "Beverages" },
    { name: "Bear Brand Fortified Milk 300 g", category: "Beverages" },
    { name: "Minute Maid Orange Juice 1 L", category: "Beverages" },
    { name: "Piattos Cheese Chips 85 g", category: "Snacks" },
    { name: "Oishi Prawn Crackers 60 g", category: "Snacks" },
    { name: "Oreo Original Cookies 133 g", category: "Snacks" },
    { name: "SkyFlakes Crackers 10-pack", category: "Snacks" },
    { name: "Nova Country Cheddar 78 g", category: "Snacks" },
    { name: "Rebisco Cream Sandwich 10-pack", category: "Snacks" },
    { name: "Century Tuna Flakes in Oil 180 g", category: "Canned Goods" },
    { name: "Argentina Corned Beef 260 g", category: "Canned Goods" },
    { name: "Mega Sardines Tomato Sauce 155 g", category: "Canned Goods" },
    { name: "555 Spanish Sardines 155 g", category: "Canned Goods" },
    { name: "Del Monte Whole Kernel Corn 425 g", category: "Canned Goods" },
    { name: "San Marino Corned Tuna 180 g", category: "Canned Goods" },
    { name: "Safeguard Pure White Soap 135 g", category: "Personal Care" },
    { name: "Colgate Total Toothpaste 150 g", category: "Personal Care" },
    { name: "Head & Shoulders Cool Menthol Shampoo 170 ml", category: "Personal Care" },
    { name: "Palmolive Naturals Conditioner 180 ml", category: "Personal Care" },
    { name: "Human Nature Hand Sanitizer 50 ml", category: "Personal Care" },
    { name: "Sunsilk Smooth & Manageable Shampoo 180 ml", category: "Personal Care" },
    { name: "Ariel Sunrise Fresh Detergent 1 kg", category: "Household" },
    { name: "Joy Lemon Dishwashing Liquid 485 ml", category: "Household" },
    { name: "Zonrox Original Bleach 1 L", category: "Household" },
    { name: "Scotch-Brite Scrub Sponge", category: "Household" },
    { name: "Glad Cling Wrap 30 m", category: "Household" },
    { name: "Champion Detergent Powder 1 kg", category: "Household" }
  ];
  const categoriesByName = new Map(categoryRows.map((category) => [category.name, category]));
  for (const [index, sample] of demoProducts.entries()) {
    const i = index + 1;
    const category = categoriesByName.get(sample.category);
    if (!category) throw new Error(`Demo category not found: ${sample.category}`);
    const supplier = supplierRows[i % supplierRows.length];
    const sku = `SKU-${String(i).padStart(4, "0")}`;
    const barcode = `480000000${String(i).padStart(3, "0")}`;
    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        name: sample.name,
        categoryId: category.id,
        primarySupplierId: supplier.id,
        description: `${sample.name} - demo catalog sample`,
        tracksExpiration: true
      },
      create: {
        name: sample.name,
        sku,
        barcode,
        categoryId: category.id,
        primarySupplierId: supplier.id,
        description: `${sample.name} - demo catalog sample`,
        costPrice: new Prisma.Decimal(20 + i),
        sellingPrice: new Prisma.Decimal(35 + i),
        currentStock: 20 + i,
        reorderLevel: 10,
        unit: "pcs",
        tracksExpiration: true,
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
  const sampleCustomerNames = [
    "Ana Reyes", "Marco Santos", "Liza Cruz", "Paolo Garcia", "Bea Ramos", "Miguel Mendoza", "Sofia Aquino",
    "Carlo Bautista", "Janelle Flores", "Nico Villanueva", "Mia Navarro", "Enzo Castillo", "Camille Torres",
    "Rafael Lim", "Trisha Gonzales", "Daniela Rivera", "Luis Mercado", "Patricia Dizon", "Gabriel Fernandez"
  ];
  for (let i = 1; i <= 20; i += 1) {
    const fullName = i === 1 ? "Walk-in Customer" : sampleCustomerNames[i - 2];
    const customerId = `10000000-0000-0000-0000-${String(i).padStart(12, "0")}`;
    await prisma.customer.upsert({
      where: { id: customerId },
      update: {
        fullName,
        phone: `092700000${String(i).padStart(2, "0")}`,
        email: `customer${i}@example.com`,
        customerType: i === 1 ? "Walk-in" : i % 4 === 0 ? "Wholesale" : i % 3 === 0 ? "Member" : "Regular",
        loyaltyPoints: i * 5
      },
      create: {
        id: customerId,
        fullName,
        phone: `092700000${String(i).padStart(2, "0")}`,
        email: `customer${i}@example.com`,
        customerType: i === 1 ? "Walk-in" : i % 4 === 0 ? "Wholesale" : i % 3 === 0 ? "Member" : "Regular",
        loyaltyPoints: i * 5
      }
    });
  }

  log("Creating supplier deliveries...");
  const products = await prisma.product.findMany({ where: { sku: { startsWith: "SKU-" } }, take: 10, orderBy: { sku: "asc" } });
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: "10000000-0000-0000-0000-000000000002" } });
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
      update: { customerId: customer.id, cashierId: cashier.id },
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
