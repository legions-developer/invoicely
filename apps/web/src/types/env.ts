import type { R2Bucket } from "@cloudflare/workers-types";

export interface CloudflareEnv {
  R2_IMAGES: R2Bucket;
}
