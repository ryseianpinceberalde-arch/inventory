import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "../types/api";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({ baseURL, withCredentials: true });

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original.headers?.["x-retried"]) {
      original.headers = original.headers ?? {};
      original.headers["x-retried"] = "true";
      const refreshed = await axios.post<ApiResponse<{ accessToken: string }>>(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
      setAccessToken(refreshed.data.data.accessToken);
      original.headers.Authorization = `Bearer ${refreshed.data.data.accessToken}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export async function getData<T>(url: string) {
  const response = await api.get<ApiResponse<T>>(url);
  return response.data.data;
}
