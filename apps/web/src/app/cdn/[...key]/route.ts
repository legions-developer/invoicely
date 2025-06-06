import { getCloudflareContext } from "@opennextjs/cloudflare";

import { NextRequest } from "next/server";

/**
 * This route is used to serve images from the R2 bucket.
 * It is used to serve images from the R2 bucket locally in development.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const awaitedParams = await params;
  const ctx = getCloudflareContext();

  const res = await ctx.env.R2_IMAGES.get(awaitedParams.key.join("/"));

  if (!res) return new Response("Image Not Found", { status: 404 });

  // const contentType = res.httpMetadata?.contentType;

  return new Response(res.body);
}
