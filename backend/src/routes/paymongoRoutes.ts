import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/paymongoController.js";
import { gcashCheckoutSchema } from "../validators/paymongoValidators.js";

export const paymongoRoutes = Router();
paymongoRoutes.use(authenticate);
paymongoRoutes.post("/gcash-checkout", requirePermission("payments.process"), validate(gcashCheckoutSchema), controller.createGcashCheckout);
paymongoRoutes.get("/checkout-sessions/:id", requirePermission("payments.view"), controller.checkoutStatus);
