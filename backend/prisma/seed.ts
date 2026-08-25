import bcrypt from "bcrypt";
import { Prisma, RoleName } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { defaultRolePermissions, permissionDefinitions } from "../src/rbac/permissions.js";

async function main() {
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({ where: { name }, update: { isSystem: true }, create: { name, description: name.replace("_", " "), isSystem: true } });
  }
  for (const permission of permissionDefinitions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { name: permission.name, module: permission.module, description: permission.description },
      create: permission
    });
  }

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
      update: {},
      create: { fullName, email, passwordHash: await bcrypt.hash(password, 12), roleId: roleByName[role] }
    });
  }

  const categories = ["Beverages", "Snacks", "Canned Goods", "Personal Care", "Household"];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name, description: `${name} products` } });
  }
  const categoryRows = await prisma.category.findMany();

  for (let i = 1; i <= 10; i += 1) {
    await prisma.supplier.upsert({
      where: { id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
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
  const supplierRows = await prisma.supplier.findMany();
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@smartstock.local" } });
  const cashier = await prisma.user.findUniqueOrThrow({ where: { email: "cashier@smartstock.local" } });

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

  const products = await prisma.product.findMany({ take: 10 });
  const customer = await prisma.customer.findFirstOrThrow();
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

  await prisma.notification.createMany({
    data: [
      { title: "Low stock sample", message: "Sample item is below reorder level.", alertType: "LOW_STOCK", priority: "HIGH", recipientRole: "MANAGER" },
      { title: "Pending delivery", message: "Supplier delivery requires review.", alertType: "DELAYED_SUPPLIER_DELIVERY", priority: "NORMAL", recipientRole: "INVENTORY_STAFF" },
      { title: "Forecast available", message: "Three-month moving average forecast was refreshed.", alertType: "FORECAST", priority: "LOW", recipientRole: "MANAGER" }
    ],
    skipDuplicates: true
  });

  await prisma.systemSetting.upsert({
    where: { key: "business" },
    update: {},
    create: { key: "business", value: { name: "SmartStock Demo Store", currency: "PHP", symbol: "₱", timezone: "Asia/Manila" } }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
