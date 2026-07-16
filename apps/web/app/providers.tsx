"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  useState,
} from "react";
import {
  Toaster,
} from "sonner";

interface ProvidersProps {
  children:
    React.ReactNode;
}

export function Providers({
  children,
}: ProvidersProps) {
  const [
    queryClient,
  ] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:
              30_000,

            retry: (
              failureCount,
              error,
            ) => {
              const status =
                (
                  error as {
                    response?: {
                      status?: number;
                    };
                  }
                ).response
                  ?.status;

              if (
                status ===
                  401 ||
                status ===
                  403 ||
                status ===
                  404
              ) {
                return false;
              }

              return (
                failureCount <
                1
              );
            },

            refetchOnWindowFocus:
              false,
          },

          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider
      client={
        queryClient
      }
    >
      {children}

      <Toaster
        richColors
        position="top-right"
        closeButton
      />
    </QueryClientProvider>
  );
}