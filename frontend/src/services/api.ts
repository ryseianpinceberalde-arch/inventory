import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "../types/api";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({ baseURL, withCredentials: true, timeout: 20000 });

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original.url?.startsWith("/auth/") && !original.headers["x-retried"]) {
      original.headers["x-retried"] = "true";
      try {
        refreshPromise ??= axios.post<ApiResponse<{ accessToken: string }>>(`${baseURL}/auth/refresh`, {}, { withCredentials: true, timeout: 20000 })
          .then((response) => { setAccessToken(response.data.data.accessToken); return response.data.data.accessToken; })
          .finally(() => { refreshPromise = null; });
        original.headers.Authorization = `Bearer ${await refreshPromise}`;
        return api(original);
      } catch (refreshError) {
        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
          setAccessToken(null);
          window.dispatchEvent(new Event("smartstock:session-expired"));
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export function errorMessage(error: unknown, fallback = "Unable to complete this request. Please try again.") {
  if (axios.isAxiosError(error)) {
    const issues = error.response?.data?.errors;
    if (Array.isArray(issues) && issues[0]?.message) return `${issues[0].path?.join(" ") ?? "Field"}: ${issues[0].message}`;
    return error.response?.data?.message ?? (error.code === "ECONNABORTED" ? "The request timed out. Check its status before retrying." : "Connection failed. Please try again.");
  }
  return error instanceof Error ? error.message : fallback;
}

export async function getData<T>(url: string) {
  const response = await api.get<ApiResponse<T>>(url);
  return response.data.data;
}

// For selector controls and local searches that need every product, respect the API's page limit.
export async function getAllProducts<T>(url = "/products?limit=100"): Promise<T[]> {
  const rows: T[] = [];
  const [path, query] = url.split("?");
  const params = new URLSearchParams(query);
  params.set("limit", "100");
  for (let page = 1; ; page += 1) {
    params.set("page", String(page));
    const response = await api.get<ApiResponse<T[]>>(`${path}?${params}`);
    rows.push(...response.data.data);
    if (page >= Number(response.data.meta?.totalPages ?? 1)) return rows;
  }
}
