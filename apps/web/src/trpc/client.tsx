"use client";
// ^-- to make sure we can mount the Provider from a server component
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { httpBatchLink, createTRPCClient } from "@trpc/client";
import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { superjsonTransformer } from "./transformer";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";
import { env } from "@invoicely/utilities";
import { useState } from "react";

let clientQueryClientSingleton: QueryClient;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient());
}

export const { TRPCProvider: TanstackTRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

interface TRPCProviderProps {
  children: React.ReactNode;
}

export function TRPCProvider(props: Readonly<TRPCProviderProps>) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: env.NEXT_PUBLIC_TRPC_BASE_URL,
          transformer: superjsonTransformer,
        }),
      ],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TanstackTRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TanstackTRPCProvider>
    </QueryClientProvider>
  );
}

// Trpc Proxy Client
export const trpcProxyClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: env.NEXT_PUBLIC_TRPC_BASE_URL, transformer: superjsonTransformer })],
});
