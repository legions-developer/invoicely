import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import { superjsonTransformer } from "./transformer";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
      },
      dehydrate: {
        serializeData: superjsonTransformer.serialize,
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjsonTransformer.deserialize,
      },
    },
  });
}
