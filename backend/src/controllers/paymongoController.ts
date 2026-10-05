import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import * as paymongo from "../services/paymongoService.js";

export const createGcashCheckout = asyncHandler(async (req: Request, res: Response) => {
  return created(res, "GCash checkout created", await paymongo.createGcashCheckout({ ...req.body, cashierId: req.user!.id }));
});

export const checkoutStatus = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "GCash checkout status loaded", await paymongo.getCheckoutStatus(req.params.id, req.user!.id));
});
