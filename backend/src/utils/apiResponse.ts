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
