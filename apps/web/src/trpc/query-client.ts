import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import { superjsonTransformer } from "./transformer";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
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
