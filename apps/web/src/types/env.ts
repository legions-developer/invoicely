import type { R2Bucket } from "@cloudflare/workers-types";

export interface CfEnv {
  R2_IMAGES: R2Bucket;
}
