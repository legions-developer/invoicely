"use client";

import {
  QueryClientProvider as TanstackQueryClientProvider,
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

import { type ReactNode } from "react";

export function TanstackProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return <TanstackQueryClientProvider client={queryClient}>{children}</TanstackQueryClientProvider>;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
