import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { Prisma } from "@prisma/client";

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

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const messages: Record<string, [number, string]> = {
      P2002: [409, "A record with these details already exists."],
      P2003: [409, "A related record is missing or still in use."],
      P2025: [404, "Record not found."],
      P2034: [409, "This record changed during your request. Please try again."]
    };
    const [status, message] = messages[err.code] ?? [500, "Unable to complete this request."];
    return res.status(status).json({ success: false, message, errors: [] });
  }
  if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ success: false, message: "Invalid JSON request.", errors: [] });
  console.error("Unhandled API error", { name: err instanceof Error ? err.name : "UnknownError" });
  return res.status(500).json({ success: false, message: "Unable to complete this request. Please try again.", errors: [] });
}
