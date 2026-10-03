# Deploy to Cloudflare Workers

The Next.js application in `apps/web` can be deployed to Workers with the [OpenNext adapter](https://opennext.js.org/cloudflare/get-started). This guide covers configuration, staging validation, and the final switch from Vercel. Adding the deployment configuration does not move production traffic.

The application continues to use Neon PostgreSQL and the existing S3-compatible R2 client. Hosting migration does not require a database migration, a new database driver, or copying uploaded assets.

## Local setup

Use Node.js 22 or newer and Yarn 4.9.1, as selected by the root `packageManager` field. Install from the repository root so workspace packages and the repository's dependency patch are included:

```sh
corepack enable
yarn install --immutable
cp .env.example .env
# Fill in .env with development values before continuing.
yarn sys-link
cp apps/web/.dev.vars.example apps/web/.dev.vars
```

Run `yarn dev` for the Next.js development server. The app uses Neon and the S3-compatible R2 client directly, so this mode does not initialize Cloudflare bindings. Run `yarn preview:cloudflare` to build the application and preview it in the Workers runtime, including its cache bindings. The application's Neon and S3 clients still connect to the services selected by `.env` in both modes; use a development database and asset bucket.

`initOpenNextCloudflareForDev` is intentionally omitted from `next.config.ts`: its binding proxy cannot run the internal `DOQueueHandler` from the production Wrangler configuration, causing a missing Durable Object export warning during `yarn dev`. If application code starts using `getCloudflareContext` directly, configure the helper with bindings suitable for Next.js development. Use `yarn preview:cloudflare` to test the generated Worker and its revalidation queue.

Before the preview build, set `NEXT_PUBLIC_BASE_URL` and `BETTER_AUTH_URL` to `http://localhost:8787`, and `NEXT_PUBLIC_TRPC_BASE_URL` to `http://localhost:8787/api/trpc`. Rebuild whenever public values or the origin change. `.dev.vars` selects `NEXTJS_ENV=development`; OpenNext reads application values from the Next.js `.env` files. See [environment variable loading](https://opennext.js.org/cloudflare/howtos/env-vars).

Run commands from the repository root:

```sh
yarn build:cloudflare        # Create the Worker and static assets
yarn preview:cloudflare      # Build, then start a local Worker preview
yarn deploy:cloudflare       # Build, then deploy the production Worker
yarn build                   # Build ordinary Next.js output
```

The root Cloudflare scripts use Turbo; preview and deploy depend on the Cloudflare build. The corresponding `yarn workspace web preview:cloudflare` and `yarn workspace web deploy:cloudflare` commands use existing build output.

## Build and runtime settings

Configure values separately in Workers **Build variables and secrets** and Worker **Variables and Secrets**. Build settings do not become runtime settings. This application's environment validator also loads server configuration during the build, so configure the server values in both places.

| Name                                                         | Build                                | Runtime           | Store as        |
| ------------------------------------------------------------ | ------------------------------------ | ----------------- | --------------- |
| `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_TRPC_BASE_URL`          | Required; compiled into browser code | Required          | Variables       |
| `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_KEY`        | Required; compiled into browser code | Required          | Variables       |
| `DATABASE_URL`                                               | Required                             | Required          | Secret          |
| `GOOGLE_CLIENT_ID`                                           | Required                             | Required          | Variable        |
| `GOOGLE_CLIENT_SECRET`                                       | Required                             | Required          | Secret          |
| `BETTER_AUTH_URL`                                            | Set to the selected origin           | Required          | Variable        |
| `BETTER_AUTH_SECRET`                                         | Set for auth initialization          | Required          | Secret          |
| `CF_R2_ENDPOINT`, `CF_R2_BUCKET_NAME`, `CF_R2_PUBLIC_DOMAIN` | Required                             | Required          | Variables       |
| `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`             | Required                             | Required          | Secrets         |
| `NEXT_PUBLIC_SENTRY_DSN`                                     | Optional; enables error reporting    | Uses compiled DSN | Public variable |
| `SENTRY_AUTH_TOKEN`                                          | Optional, for source-map uploads     | Unused            | Build secret    |

Browser, server, and edge Sentry configurations use the same `NEXT_PUBLIC_SENTRY_DSN`. Set it before building and rebuild after changing it; runtime-only changes do not replace the compiled DSN.

The Google OAuth callback is `<origin>/api/auth/callback/google`; authorize the staging callback separately. Use staging credentials and storage for staging. Do not disable environment validation for a real deployment or commit local environment files.

Wrangler's `keep_vars: true` preserves dashboard-managed variables when deploying. Configure the staging and production Workers independently.

## Cloudflare resources

The Worker configuration is in `apps/web/wrangler.jsonc`, and the adapter configuration is in `apps/web/open-next.config.ts`.

- `NEXT_INC_CACHE_R2_BUCKET` stores Next.js cache data. Give staging and production separate cache buckets, and keep both separate from the invoice asset bucket configured by `CF_R2_BUCKET_NAME`.
- `NEXT_CACHE_DO_QUEUE` uses `DOQueueHandler` for background revalidation. Wrangler creates the Durable Object namespace using the configured migration.
- `WORKER_SELF_REFERENCE` must point to the same Worker being deployed in that environment.
- `IMAGES` provides `next/image` optimization. Ensure Cloudflare Images is available on the account and review its [transformation pricing](https://opennext.js.org/cloudflare/howtos/image).

The current application does not call `revalidatePath` or `revalidateTag`. Add an OpenNext tag cache before introducing those features; see the [cache configuration guide](https://opennext.js.org/cloudflare/caching).

The configured Worker names are `invoicely-web` and `invoicely-web-staging`. Before their first deployments, create the cache buckets using an authorized Cloudflare account:

```sh
yarn workspace web wrangler r2 bucket create invoicely-next-cache
yarn workspace web wrangler r2 bucket create invoicely-next-cache-staging
```

## Workers Builds

Connect the repository to Workers Builds. Use the repository root (`/`) as the root directory so Yarn sees `yarn.lock` and all workspaces. Configure Node.js 22 or newer and Yarn 4.9.1, and install with `yarn install --immutable`.

| Setting        | Production                             | Staging                                              |
| -------------- | -------------------------------------- | ---------------------------------------------------- |
| Worker name    | `invoicely-web`                        | `invoicely-web-staging`                              |
| Build command  | `yarn build:cloudflare`                | `yarn workspace web build:cloudflare --env staging`  |
| Deploy command | `yarn workspace web deploy:cloudflare` | `yarn workspace web deploy:cloudflare --env staging` |

Configure build and runtime values before starting the first deployment. Use the staging environment for validation; its empty `routes` setting prevents it from inheriting the production domains. [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) describes the build, deploy, and environment settings.

For a staging deployment from the CLI, first set the local build values to the staging origin, a separate Neon branch/development database, and a staging asset bucket. Set the matching Worker runtime values and authorize the staging Google callback. Then run:

```sh
yarn workspace web build:cloudflare --env staging
yarn workspace web deploy:cloudflare --env staging
```

Use `--env staging` for both steps. Rebuild with production values before deploying production; public URLs are embedded during the build. To check bundling without deploying, run `yarn workspace web wrangler deploy --dry-run --env staging` after the staging build, or `yarn workspace web wrangler deploy --dry-run --env ""` after the production build. Use the OpenNext deployment script for real deployments so it also populates the incremental cache.

## Automatic branch and pull request previews

Enable **Preview builds** in the `invoicely-web` Worker's Git build settings. Cloudflare builds non-production branches and posts their Preview URLs on associated pull requests. This uses [native Worker Previews](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/), separately from the named `staging` Worker above.

Keep the repository root as the build root and configure:

| Setting                   | Value                                          |
| ------------------------- | ---------------------------------------------- |
| Build command             | `yarn build:cloudflare`                        |
| Production deploy command | `yarn workspace web deploy:cloudflare`         |
| Preview command           | `yarn workspace web deploy:cloudflare:preview` |
| Preview build variable    | `CLOUDFLARE_PREVIEW=true`                      |

Set `CLOUDFLARE_PREVIEW=true` in preview build settings, starting with **Build variables and secrets → Previews Base**; leave it unset for production. The checked-in `previews.vars` configuration also supplies it at runtime. Copy the required application values into both build and runtime **Previews Base** settings before creating previews. The selected setup reuses the existing database, uploaded-asset bucket, Google client, and auth secret, so changes made through a preview affect that shared data. [Preview Base settings](https://developers.cloudflare.com/workers/previews/configuration/) initialize new previews; changes to Base secrets do not update already-created previews.

An existing branch Preview has its own build settings. Select its branch from the environment dropdown beside the Worker name, then open **Settings → Builds** and update its build command, Preview command, root directory, and build variables and secrets, including `CLOUDFLARE_PREVIEW=true`. Also check its runtime **Variables and Secrets**. Updating **Previews Base** alone can leave that existing branch with the original command and an empty variable list. Save the branch settings before retrying its build.

The production Worker owns `invoicely.gg`. Its preview-only custom domain is `preview.invoicely.gg`, so branch URLs use `<preview-name>.preview.invoicely.gg`. These routes are checked into Wrangler configuration, with production and preview `workers.dev` URLs disabled. The separate staging Worker retains its `workers.dev` URL and has no custom domains. Cloudflare manages domain DNS and certificates; initial preview certificate issuance may take time. See [custom preview domains](https://developers.cloudflare.com/workers/previews/custom-domains/).

Browser auth and tRPC requests use the current preview origin. Preview server auth derives the HTTPS allowlist `*.preview.invoicely.gg` from `BETTER_AUTH_URL=https://invoicely.gg`; no Worker name or account subdomain is hardcoded in auth. Keep that canonical value in preview build and runtime settings. Production auth uses it directly. The public production URL variables remain canonical metadata and server fallback URLs. Custom preview HTML, API responses, and static assets receive `X-Robots-Tag: noindex`; production does not. If the canonical domain changes, update Wrangler routes and the preview header rules with it.

Google login uses Better Auth's [OAuth proxy](https://better-auth.com/docs/plugins/oauth-proxy) through the existing authorized `https://invoicely.gg/api/auth/callback/google` callback, then creates the session on the preview origin. Deploy this auth version to the application serving `https://invoicely.gg` before testing preview sign-in, even if that application is still hosted on Vercel. Production and previews must use the same Better Auth version and `BETTER_AUTH_SECRET`, along with the existing Google credentials. No per-preview Google callback registration is needed after the production proxy is available. Keep automatic builds limited to trusted repository branches because these previews use shared application credentials and data.

The hosted Preview command populates the build-time Next.js cache into the Preview's own static assets, then runs `wrangler preview`. New previews start with dashboard Preview Base settings; existing previews retain their own settings. Unlike production, this cache is read-only: previews support the current static pages and dynamic request handling, but do not perform ISR or background revalidation. Revisit this configuration if server-side timed revalidation or `revalidatePath`/`revalidateTag` is added. Preview caches have no R2 or Durable Object queue bindings; a [Preview service binding targets production](https://developers.cloudflare.com/workers/previews/resources/#service-bindings), so the production self-reference must not be copied into the preview configuration.

For a manual hosted branch preview, use `yarn deploy:cloudflare:preview` from the repository root; it sets the preview flag, builds, and uploads. `yarn preview:cloudflare` remains the local Workers development command. Do not use the local command as the dashboard Preview command.

## Required staging checks

A successful build or Wrangler dry run does not establish that authenticated application flows work on Cloudflare. Validate these on the deployed staging Worker before switching the production domain:

- Landing pages, blog pages, unknown blog slugs, and missing-page responses.
- Google login, session persistence/refresh, and logout.
- Saving, loading, updating, and deleting an invoice; saved invoice defaults; local invoice migration.
- Uploading, listing, displaying, and deleting logos and signatures in the staging R2 asset bucket.
- PDF preview and download, including CJK fonts and invoices spanning several pages.
- Optimized images, generated Open Graph images, PostHog `/ingest` requests, and Sentry reporting/source maps.
- Worker logs, startup time, request CPU usage, and error rates under representative traffic.

Compare Wrangler's uncompressed `Total Upload` with the [current Worker size limit](https://developers.cloudflare.com/workers/platform/limits/#worker-size). As of October 2026, the limit is 64 MiB for both Free and Paid plans; compressed size is informational. Select a plan using measured request CPU usage and traffic, and account for R2 and Images separately.

## Production cutover and rollback

1. Complete staging validation and retain the working Vercel deployment for rollback.
2. Set production build/runtime values. Preserve the existing Neon database, R2 asset bucket, public asset domain, object keys, and `BETTER_AUTH_SECRET`.
3. Keep `NEXT_PUBLIC_BASE_URL` and `BETTER_AUTH_URL` at `https://invoicely.gg`, and `NEXT_PUBLIC_TRPC_BASE_URL` at `https://invoicely.gg/api/trpc`. Keep the existing Google OAuth callback authorized. Preserving the browser origin retains access to locally stored IndexedDB invoices and keeps auth cookie scope consistent.
4. Build and deploy the production Worker with `yarn deploy:cloudflare`. The checked-in routes attach `invoicely.gg` for production and `preview.invoicely.gg` for previews only. When moving from another host, remove only its conflicting DNS records before attaching the domains; preserve email, storage, and unrelated records. A staging deployment explicitly has no custom domains.
5. After routing changes, verify production login, saved invoices, existing assets, local invoices, and PDF generation. Disable automatic Vercel production deployments once the cutover is confirmed.

To roll back, restore the previous domain routing to the retained Vercel deployment. Keep the same database, asset storage, auth secret, and public origin during rollback.
