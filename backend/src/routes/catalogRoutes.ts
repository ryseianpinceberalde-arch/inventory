import { Router } from "express";
import { authenticate, requireAnyPermission, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/catalogController.js";
import { categorySchema, customerSchema, productSchema, supplierProductSchema, supplierSchema } from "../validators/catalogValidators.js";

export const productRoutes = Router();
productRoutes.use(authenticate);
productRoutes.get("/", requireAnyPermission(["products.view", "pos.access", "inventory.view", "inventory.stock_in", "inventory.stock_out", "inventory.adjustment_create", "barcodes.view"]), controller.listProducts);
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
supplierProductRoutes.post("/", requirePermission("suppliers.update"), validate(supplierProductSchema), controller.createSupplierProduct);
supplierProductRoutes.put("/:id", requirePermission("suppliers.update"), validate(supplierProductSchema), controller.updateSupplierProduct);

export const customerRoutes = Router();
customerRoutes.use(authenticate);
customerRoutes.get("/", requirePermission("customers.view"), controller.listCustomers);
customerRoutes.post("/", requirePermission("customers.create"), validate(customerSchema), controller.createCustomer);
customerRoutes.get("/:id", requirePermission("customers.view"), controller.getCustomer);
customerRoutes.put("/:id", requirePermission("customers.update"), validate(customerSchema.partial()), controller.updateCustomer);
