# Cloudflare deployment

Invoicely runs on Cloudflare Workers through `@opennextjs/cloudflare`. The adapter builds the existing Next.js app in `apps/web`; Neon PostgreSQL, Better Auth, invoice PDF generation, and the existing S3-compatible R2 asset storage remain in place.

## Local development and preview

Use Node.js 22 or newer and the repository's Yarn 4.9.1 release:

```sh
yarn install --immutable
cp .env.example .env
# Fill in the existing application variables.
yarn sys-link
cp apps/web/.dev.vars.example apps/web/.dev.vars
yarn dev
```

`yarn dev` continues to use Next.js. To build and run the application in the actual Workers runtime instead:

```sh
yarn preview:cloudflare
```

The preview normally runs at `http://localhost:8787`. Set `NEXT_PUBLIC_BASE_URL`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_TRPC_BASE_URL` to the preview origin (and `/api/trpc` for the tRPC URL) **before building**. Changing the port or public variables requires a new build. OpenNext loads local application values from the Next.js `.env` files; `.dev.vars` selects `NEXTJS_ENV=development`.

Use a development database and asset bucket for preview mutations. Local OpenNext cache storage is emulated; the app's existing S3 client still accesses the real R2 bucket configured by `CF_R2_*`.

Other commands:

```sh
yarn build:cloudflare                       # Build .open-next/worker.js and assets
yarn workspace web preview:cloudflare       # Preview an already-built Worker
yarn workspace web smoke:cloudflare         # Start a local preview and run HTTP regression checks
yarn workspace web wrangler deploy --dry-run --env "" # Validate production bundling without deploying
yarn build                                  # Ordinary Next.js build for rollback/self-hosting
```

## Cloudflare resources

The checked-in configuration names the production Worker `invoicely-web` and the staging Worker `invoicely-web-staging`. Provision these cache buckets once:

```sh
yarn workspace web wrangler r2 bucket create invoicely-next-cache
yarn workspace web wrangler r2 bucket create invoicely-next-cache-staging
```

`NEXT_INC_CACHE_R2_BUCKET` stores Next.js prerender/data cache entries. Keep it separate from the existing invoice image bucket. `WORKER_SELF_REFERENCE` must refer to the Worker for the selected environment. The `NEXT_CACHE_DO_QUEUE` Durable Object binding and `v1` migration support background revalidation, including cached blog 404s; Wrangler provisions those objects on deployment. `IMAGES` enables Cloudflare Images transformations for `next/image`; enable that product on the account and review its pricing.

Check Wrangler's uncompressed `Total Upload` against the [64 MiB Worker limit](https://developers.cloudflare.com/workers/platform/limits/#worker-size), which applies to both Free and Paid plans. Cloudflare removed the compressed size limits on September 4, 2026; the `gzip` value is now informational. The migration build measured approximately 24.3 MiB uncompressed and 5.5 MiB compressed, so bundle size alone does not require Workers Paid. Choose the plan after checking staging CPU usage and request volume against the account limits, and review R2 and Images usage separately. Workers Free allows 10 ms of CPU time per request; local response times do not establish production CPU usage.

The application currently uses static blog generation and dynamic API routes; adding `revalidatePath` or `revalidateTag` requires the corresponding OpenNext tag-cache configuration as well.

The GitHub Actions workflow builds and boots the Worker with inert credentials and checks public routes, all generated blogs, missing pages, logged-out sessions, protected APIs, static cache headers, optimized images, and OG generation. OAuth and authenticated database/R2 mutations still need the staging checks below. To check an already-running preview, set `CLOUDFLARE_PREVIEW_URL=http://localhost:8787` when running `smoke:cloudflare`.

## Build variables and runtime configuration

In Workers Builds, set the repository root directory to `/`, the build command to `yarn build:cloudflare`, and the deploy command to `yarn workspace web deploy:cloudflare`. Yarn must install dependencies from the repository root so the workspace packages and `patch-package` patch are available. The CLI alternative is `yarn deploy:cloudflare`, which builds before deploying.

Configure **both** Workers Builds variables/secrets and Worker runtime variables/secrets. Runtime configuration alone does not supply the build. The application validates its environment when modules load, so the build needs the server variables as well as the public variables.

| Variables                                                                                                  | Build                              | Runtime                                         | Storage      |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------- | ------------ |
| `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_TRPC_BASE_URL`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_KEY` | Required; embedded in browser code | Also set for server-side use                    | Variables    |
| `DATABASE_URL`                                                                                             | Required by environment validation | Required                                        | Secret       |
| `GOOGLE_CLIENT_ID`                                                                                         | Required                           | Required                                        | Variable     |
| `GOOGLE_CLIENT_SECRET`                                                                                     | Required                           | Required                                        | Secret       |
| `BETTER_AUTH_URL`                                                                                          | Set for selected origin            | Required                                        | Variable     |
| `BETTER_AUTH_SECRET`                                                                                       | Set                                | Required; preserve the current production value | Secret       |
| `CF_R2_ENDPOINT`, `CF_R2_BUCKET_NAME`, `CF_R2_PUBLIC_DOMAIN`                                               | Required                           | Required                                        | Variables    |
| `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`                                                           | Required                           | Required                                        | Secrets      |
| `SENTRY_AUTH_TOKEN`                                                                                        | Optional, for source-map upload    | Not needed                                      | Build secret |

Keep the production public and auth origin at `https://invoicely.gg`, with tRPC at `https://invoicely.gg/api/trpc`. Keep the existing Neon database, R2 asset bucket, public domains, and object keys. No database migration or object copy is required for this hosting change. Keep the existing Google OAuth callback `https://invoicely.gg/api/auth/callback/google` authorized.

Dashboard-managed variables are retained by `keep_vars: true` in Wrangler. Do not commit `.env`, `.dev.vars`, generated binding types, or `.open-next`. `SKIP_ENV_VALIDATION` is for controlled checks only; configure actual production values instead of disabling validation.

## Staging and cutover

1. Set staging build values and runtime secrets, including a separate Neon branch/development database and R2 asset bucket. Set the public/auth URLs to the staging origin and authorize its Google callback. Configure the same values in the local build environment if deploying from the CLI.
2. Build and deploy with the staging configuration:

   ```sh
   yarn workspace web build:cloudflare --env staging
   yarn workspace web deploy:cloudflare --env staging
   ```

   In Workers Builds, use these commands for the staging Worker. Bindings in the staging configuration use the staging cache bucket and self-reference.

3. Verify landing/blog pages and missing-page handling; Google sign-in, session refresh and logout; invoice saving/loading; logo/signature upload, listing and deletion; PDF preview/download, CJK fonts and multi-page invoices; optimized images; OG images; PostHog `/ingest` rewrites; and Sentry error/source-map reporting. Check Worker logs, uncompressed bundle size, and CPU usage against the selected plan's limits.
4. Build with production values and run `yarn deploy:cloudflare`. Keep the Vercel deployment available during validation.
5. Attach the production custom domain/route only after staging passes. Preserve the `https://invoicely.gg` origin: IndexedDB invoices are browser-origin-scoped, and auth cookies rely on consistent origin/secret settings.
6. Verify production and disable Vercel's automatic production deployments after the cutover is confirmed. To roll back, restore the previous domain routing to the retained Vercel deployment, using the same database and storage.

The repository configuration does not attach a production domain automatically. Creating or merging the PR alone does not switch live traffic.

References: [OpenNext setup](https://opennext.js.org/cloudflare/get-started), [environment variables](https://opennext.js.org/cloudflare/howtos/env-vars), [cache configuration](https://opennext.js.org/cloudflare/caching), [image optimization](https://opennext.js.org/cloudflare/howtos/image).
