import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/stores/auth-store";
import type {
  RefreshTokenResponse,
} from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RetryableAxiosRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise:
  | Promise<string>
  | null = null;

async function refreshAccessToken(): Promise<string> {
  const authState =
    useAuthStore.getState();

  const refreshToken =
    authState.refreshToken;

  if (!refreshToken) {
    throw new Error(
      "Refresh token is not available.",
    );
  }

  const response =
    await refreshClient.post<RefreshTokenResponse>(
      "/auth/refresh",
      {
        refresh_token: refreshToken,
      },
    );

  const refreshedTokens =
    response.data;

  authState.updateTokens({
    access_token:
      refreshedTokens.access_token,
    refresh_token:
      refreshedTokens.refresh_token ??
      refreshToken,
    token_type:
      refreshedTokens.token_type ??
      "bearer",
    access_token_expires_in:
      refreshedTokens.access_token_expires_in,
  });

  return refreshedTokens.access_token;
}

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig,
  ) => {
    const accessToken =
      useAuthStore.getState()
        .accessToken;

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: AxiosError) =>
    Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  async (
    error: AxiosError,
  ) => {
    const originalRequest =
      error.config as
        | RetryableAxiosRequestConfig
        | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest
    ) {
      return Promise.reject(error);
    }

    const requestUrl =
      originalRequest.url ?? "";

    const isAuthEndpoint =
      requestUrl.includes(
        "/auth/login",
      ) ||
      requestUrl.includes(
        "/auth/register",
      ) ||
      requestUrl.includes(
        "/auth/refresh",
      );

    if (
      isAuthEndpoint ||
      originalRequest._retry
    ) {
      useAuthStore
        .getState()
        .logout();

      if (
        typeof window !==
        "undefined"
      ) {
        window.location.href =
          "/login";
      }

      return Promise.reject(error);
    }

    originalRequest._retry =
      true;

    try {
      if (!refreshPromise) {
        refreshPromise =
          refreshAccessToken().finally(
            () => {
              refreshPromise = null;
            },
          );
      }

      const newAccessToken =
        await refreshPromise;

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(
        originalRequest,
      );
    } catch (
      refreshError
    ) {
      useAuthStore
        .getState()
        .logout();

      if (
        typeof window !==
        "undefined"
      ) {
        window.location.href =
          "/login";
      }

      return Promise.reject(
        refreshError,
      );
    }
  },
);

export function getApiErrorMessage(
  error: unknown,
): string {
  if (
    !axios.isAxiosError(error)
  ) {
    return (
      error instanceof Error
        ? error.message
        : "An unexpected error occurred."
    );
  }

  const responseData =
    error.response?.data as
      | {
          detail?:
            | string
            | Array<{
                msg?: string;
              }>;
          error?: {
            message?: string;
          };
          message?: string;
        }
      | undefined;

  if (
    Array.isArray(
      responseData?.detail,
    )
  ) {
    return (
      responseData.detail
        .map(
          (item) =>
            item.msg,
        )
        .filter(Boolean)
        .join(", ") ||
      "Validation failed."
    );
  }

  return (
    responseData?.error
      ?.message ??
    responseData?.message ??
    (
      typeof responseData?.detail ===
      "string"
        ? responseData.detail
        : undefined
    ) ??
    error.message ??
    "Request failed."
  );
}

export async function apiRequest<
  TResponse,
>(
  config: AxiosRequestConfig,
): Promise<TResponse> {
  const response =
    await api.request<TResponse>(
      config,
    );

  return response.data;
}