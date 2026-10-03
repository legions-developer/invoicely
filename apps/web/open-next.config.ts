import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Native Worker Previews serve their own build-time cache from their assets.
// A Preview service binding would otherwise send revalidation to production.
export default defineCloudflareConfig(
  process.env.CLOUDFLARE_PREVIEW === "true"
    ? { incrementalCache: staticAssetsIncrementalCache }
    : { incrementalCache: r2IncrementalCache, queue: doQueue },
);
