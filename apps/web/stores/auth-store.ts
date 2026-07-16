"use client";

import { create } from "zustand";
import {
  persist,
} from "zustand/middleware";

import type {
  AuthTokens,
  User,
} from "@/types/auth";

interface AuthState {
  user: User | null;

  accessToken:
    | string
    | null;

  refreshToken:
    | string
    | null;

  tokenType: string;

  isAuthenticated: boolean;
  hasHydrated: boolean;

  setAuth: (
    tokens: AuthTokens,
    user?: User | null,
  ) => void;

  updateTokens: (
    tokens: AuthTokens,
  ) => void;

  setUser: (
    user: User | null,
  ) => void;

  setHasHydrated: (
    value: boolean,
  ) => void;

  logout: () => void;
}

export const useAuthStore =
  create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        tokenType: "bearer",
        isAuthenticated: false,
        hasHydrated: false,

        setAuth: (
          tokens,
          user = null,
        ) =>
          set({
            user,
            accessToken:
              tokens.access_token,
            refreshToken:
              tokens.refresh_token,
            tokenType:
              tokens.token_type ??
              "bearer",
            isAuthenticated: true,
          }),

        updateTokens: (
          tokens,
        ) =>
          set((state) => ({
            accessToken:
              tokens.access_token,

            refreshToken:
              tokens.refresh_token ??
              state.refreshToken,

            tokenType:
              tokens.token_type ??
              state.tokenType,

            isAuthenticated: true,
          })),

        setUser: (
          user,
        ) =>
          set({
            user,
            isAuthenticated:
              Boolean(user),
          }),

        setHasHydrated: (
          value,
        ) =>
          set({
            hasHydrated:
              value,
          }),

        logout: () =>
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            tokenType: "bearer",
            isAuthenticated: false,
          }),
      }),

      {
        name:
          "nexusai-auth",

        partialize: (
          state,
        ) => ({
          user:
            state.user,

          accessToken:
            state.accessToken,

          refreshToken:
            state.refreshToken,

          tokenType:
            state.tokenType,

          isAuthenticated:
            state.isAuthenticated,
        }),

        onRehydrateStorage:
          () =>
          (
            state,
          ) => {
            state?.setHasHydrated(
              true,
            );
          },
      },
    ),
  );