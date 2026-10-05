import { Response } from "express";
import { stripSecrets } from "../rbac/serializers.js";

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export function ok<T>(res: Response, message: string, data: T, meta?: ApiMeta) {
  return res.json({ success: true, message, data: stripSecretsExceptAuth(data), meta: meta ?? {} });
}

export function created<T>(res: Response, message: string, data: T) {
  return res.status(201).json({ success: true, message, data: stripSecrets(data), meta: {} });
}

// Auth responses intentionally return a top-level access token; nested credentials never leave the API.
function stripSecretsExceptAuth<T>(data: T) {
  const clean = stripSecrets(data);
  if (data && typeof data === "object" && "accessToken" in data && clean && typeof clean === "object") {
    return { ...clean, accessToken: data.accessToken };
  }
  return clean;
}
