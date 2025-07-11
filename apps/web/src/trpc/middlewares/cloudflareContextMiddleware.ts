import { getCloudflareContext } from "@opennextjs/cloudflare";
import { middleware } from "@/trpc/init";

export const cloudflareContextMiddleware = middleware(async function (options) {
  const { env, ctx } = getCloudflareContext();

  return options.next({
    ctx: {
      cloudflareEnv: env,
      cloudflareContext: ctx,
    },
  });
});
