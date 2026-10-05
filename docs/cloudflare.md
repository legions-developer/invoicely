# Deploy to Cloudflare Workers

The Next.js application in `apps/web` can be deployed to Workers with the [OpenNext adapter](https://opennext.js.org/cloudflare/get-started). The active deployment model is production plus isolated branch previews. The named staging Worker described below is optional; it does not need to be provisioned for this setup. Adding the deployment configuration does not move production traffic.

The application continues to use Neon PostgreSQL and the existing S3-compatible R2 client. Hosting migration does not require a database migration, a new database driver, or copying uploaded assets.

## Local setup

Use Node.js 22.9.0 or newer and Yarn 4.9.1, as selected by the root `packageManager` field. Install from the repository root so workspace packages and the repository's dependency patches are included:

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
yarn deploy:cloudflare       # Manual build/deploy; does not run production migrations
yarn build                   # Build ordinary Next.js output
```

The root Cloudflare build wraps Turbo so native hosted preview builds can prepare their database first. The corresponding workspace preview and deploy commands use existing build output. Automatic production migrations run only through the native Cloudflare production deploy command below; local commands and the root Turbo deployment shortcut retain their manual behavior.

## Build and runtime settings

Configure values separately in Workers **Build variables and secrets** and Worker **Variables and Secrets**. Build settings do not automatically become runtime settings. This application's environment validator also loads server configuration during the build, so configure the server values in both places. Native preview builds generate their own `DATABASE_URL`; the guarded production deployment uses its configured production build URL. Both deployment wrappers explicitly upload their database URL as a runtime secret. The other application values remain in the existing Cloudflare settings.

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

The Google OAuth callback is `<origin>/api/auth/callback/google`; previews use the production OAuth proxy described below. If using the optional staging Worker, authorize its callback separately and use staging credentials and storage. Do not disable environment validation for a real deployment or commit local environment files.

Wrangler's `keep_vars: true` preserves dashboard-managed variables when deploying. Configure Preview Base and production settings separately, along with the staging Worker only if it is used.

## Cloudflare resources

The Worker configuration is in `apps/web/wrangler.jsonc`, and the adapter configuration is in `apps/web/open-next.config.ts`.

- `NEXT_INC_CACHE_R2_BUCKET` stores Next.js cache data. Keep this separate from the invoice asset bucket configured by `CF_R2_BUCKET_NAME`. If using staging, give it a separate cache bucket. Previews use their own static asset cache, described below.
- `NEXT_CACHE_DO_QUEUE` uses `DOQueueHandler` for background revalidation. Wrangler creates the Durable Object namespace using the configured migration.
- `WORKER_SELF_REFERENCE` must point to the same Worker being deployed in that environment.
- `IMAGES` provides `next/image` optimization. Ensure Cloudflare Images is available on the account and review its [transformation pricing](https://opennext.js.org/cloudflare/howtos/image).

The current application does not call `revalidatePath` or `revalidateTag`. Add an OpenNext tag cache before introducing those features; see the [cache configuration guide](https://opennext.js.org/cloudflare/caching).

The production Worker is `invoicely-web`. Before its first deployment, create the cache bucket using an authorized Cloudflare account:

```sh
yarn workspace web wrangler r2 bucket create invoicely-next-cache
```

## Workers Builds

Connect the repository to Workers Builds. Use the repository root (`/`) as the root directory so Yarn sees `yarn.lock` and all workspaces. Configure Node.js 22.9.0 or newer and Yarn 4.9.1, and install with `yarn install --immutable`.

| Setting        | Production                             | Preview                                        |
| -------------- | -------------------------------------- | ---------------------------------------------- |
| Worker name    | `invoicely-web`                        | Branch Preview under `invoicely-web`           |
| Build command  | `yarn build:cloudflare`                | `yarn build:cloudflare`                        |
| Deploy command | `yarn workspace web deploy:cloudflare` | `yarn workspace web deploy:cloudflare:preview` |

Keep **Enable Preview Builds** enabled in **Settings → Builds → Branch control**, and use the existing build and deploy commands above. Configure the additional Neon values in Preview Base as described below. [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) describes the build, deploy, and environment settings.

### Production migrations

Keep the production build command `yarn build:cloudflare` and deploy command `yarn workspace web deploy:cloudflare`. Cloudflare finishes the application build first; the deploy command then runs `scripts/production.mjs deploy`. Do not replace this dashboard deploy command with the root `yarn deploy:cloudflare` shortcut: the guard requires Cloudflare's native build identity.

In the **Production** build settings, `DATABASE_URL` must point to the existing production database `Invoicely-prod`, owner `Invoicely-prod_owner`, at `ep-wispy-thunder-a1jhwivm.ap-southeast-1.aws.neon.tech` or its pooled endpoint, with SSL enabled. Leave `CLOUDFLARE_PREVIEW` unset. Production needs no Neon management key, new Cloudflare token, or database credentials in GitHub. The wrapper accepts only the native `main` build and known production database; malformed build identity, preview context, and deploy overrides stop it.

The wrapper acquires a PostgreSQL advisory lock through a dedicated direct connection and holds it through migration and deployment. It checks that the build commit is still the current `main` head, runs `yarn workspace @invoicely/db db:migrate` over the direct connection, and checks `main` again before deploying. Migration failure, stale commit, or loss of the lock connection stops deployment. Concurrent guarded production deployments wait for the same lock, with a bounded timeout.

After migrations succeed, OpenNext deploys with a temporary owner-readable secrets file containing the original production `DATABASE_URL`. This sets runtime access to the same production database used by the build and migrations; other dashboard-managed secrets remain in place. The file is removed after the deployment attempt. Production runtime credentials are synchronized by this deployment step, not by editing the build secret alone.

Only committed migrations run; this process never generates SQL or uses `db:push`. Keep schema changes compatible with the currently serving app: migrations can commit before a later head check or deployment fails, and application rollback does not undo them. The live production schema and migration history have not been verified by this setup. Initial migrations tolerate existing objects, and older migration files were edited historically, so successful execution alone does not establish a clean baseline.

### Optional staging Worker

This project uses preview and production environments; provisioning staging is optional. Its configured Worker name is `invoicely-web-staging`, and its empty `routes` setting prevents it from inheriting production domains. For a staging deployment from the CLI, first set the local build values to the staging origin, a separate Neon branch/development database, and a staging asset bucket. Set the matching Worker runtime values and authorize the staging Google callback. Then run:

```sh
yarn workspace web wrangler r2 bucket create invoicely-next-cache-staging
yarn workspace web build:cloudflare --env staging
yarn workspace web deploy:cloudflare --env staging
```

Use `--env staging` for both steps. Rebuild with production values before deploying production; public URLs are embedded during the build. To check bundling without deploying, run `yarn workspace web wrangler deploy --dry-run --env staging` after the staging build, or `yarn workspace web wrangler deploy --dry-run --env ""` after the production build. Use the OpenNext deployment script for real deployments so it also populates the incremental cache.

## Automatic branch previews

Cloudflare Workers Builds continues to own preview builds and deployments. Each trusted Git branch receives a native Worker Preview under `invoicely-web`. Every Cloudflare build gets its own Neon branch from the configured dev parent, named `preview/<branch-slug>-<branch-hash>/build-<build-hash>`. The build hash comes from Cloudflare's build UUID, so overlapping builds use separate databases. GitHub Actions does not build or deploy previews, and no Cloudflare credentials or application-settings JSON are needed in GitHub.

The existing `yarn build:cloudflare` command runs `scripts/preview.mjs build`. Inside a native preview build (`WORKERS_CI=1` and `CLOUDFLARE_PREVIEW=true`), it verifies the dev parent, creates that build's database branch, applies committed migrations using its direct connection, and builds using its pooled `DATABASE_URL`. Cloudflare supplies the Git branch, commit, and build identifiers. Production and local builds do not provision Neon branches or run preview migrations.

Every new build starts from the dev baseline and applies the current committed migrations. **Preview data edits do not carry into the next successful deployment.** A failed build leaves the deployed Preview's database intact. Previous build databases remain until the Git branch is deleted, so account for these branches when monitoring Neon usage and limits.

### Cloudflare preview configuration

In **Workers & Pages → invoicely-web → Settings → Builds → Previews Base tab → Variables and secrets**, configure:

| Name                    | Store as | Value                                                  |
| ----------------------- | -------- | ------------------------------------------------------ |
| `NEON_API_KEY`          | Secret   | Neon management API key with access to the dev project |
| `NEON_PROJECT_ID`       | Variable | `bitter-voice-28471675`                                |
| `NEON_PARENT_BRANCH_ID` | Variable | `br-fancy-voice-a17qlbyg`                              |

Keep `CLOUDFLARE_PREVIEW=true` in preview build settings and leave it unset for production. Keep the existing application build and runtime settings in Cloudflare. `NEON_API_KEY` is only a build secret; do not add it to Worker runtime variables or secrets. The build script strips Neon management settings before starting migrations, the application build, and Wrangler. The generated preview `DATABASE_URL` replaces any inherited build or runtime database URL during the managed build and upload.

New previews inherit Preview Base configuration. Updating Base does not update already-created previews: add these three build settings to any existing branch Preview that needs another build, or recreate that Preview from the updated Base. See [Preview configuration](https://developers.cloudflare.com/workers/previews/configuration/).

The Neon parent is the dev baseline, even though its current branch name is `production`. Keep this baseline's schema and migration history aligned with deployed production and use test data. The script verifies that this parent owns the known dev endpoint `ep-royal-lab-a1j1ksvy` before creating or cleaning up branches. New branches use database `invoicely` and role `invoicely_owner`. The separate production database is not used for previews.

Use preview storage values to isolate uploads as well. If the existing R2 values point to a shared bucket, previews still share uploaded assets even though their databases are isolated. The Google credentials and Better Auth secret remain shared for the OAuth proxy described below. Keep automatic builds limited to trusted repository branches because builds have access to these credentials and the Neon management key.

### Build and deployment handoff

The successful build writes its generated database URL to the ignored `apps/web/.wrangler/neon-preview.json` with owner-only permissions. The file also records the Git branch, commit, build, project, and parent IDs. The existing upload command, `yarn workspace web deploy:cloudflare:preview`, refuses a native upload if this state is absent or belongs to a different build. A migration or build failure therefore prevents the new deployment.

The upload command populates the cache and uses Wrangler's `preview --secrets-file` support to upload the application code and generated runtime `DATABASE_URL` together. The temporary secrets file contains only that database secret; the other existing Cloudflare application settings remain in place. The script removes its temporary secret and handoff files after the upload attempt. Setting a build variable alone does not configure the Worker runtime, so do not replace this upload command with a bare `wrangler preview` invocation.

Keep native preview builds enabled, save the settings, and merge the script changes before testing an updated trusted branch. Adding the Neon settings alone does not change an already-deployed Preview's database. Production migration and deployment remain separate from this preview lifecycle.

### GitHub build reports

Cloudflare continues to publish its native `Workers Builds: invoicely-web` check. The `.github/workflows/cloudflare-build-report.yml` workflow, **Report Cloudflare build and migrations**, updates one bot comment per environment on the matching PR. It observes `main` pushes and same-repository PR updates, waiting up to 30 minutes for that exact commit's Cloudflare build. Completed checks from the verified Cloudflare app ID `85455` can also trigger an immediate report. The observer uses read-only GitHub access; the report job uses GitHub's built-in token with `contents: read`, `checks: read`, and `pull-requests: write`. Neither job deploys nor connects to a database, and both execute only trusted default-branch code.

The reporter verifies the check's app, commit, suite branch, and Cloudflare build URL. A successful check is treated as evidence of migration execution only when that checked commit contains the recognized `migrationLifecycleVersion = 1` marker and package-script hooks. This is an inference from the required hook and overall result, not a separate database inspection. Failed or interrupted checks direct readers to the Cloudflare logs for the individual migration outcome.

The normal sequence is:

1. Push a trusted branch. Cloudflare provisions a database for that build, migrates, builds, and deploys the Preview. The native check and Preview comment report that commit's result.
2. Review the Preview and merge into `main`. Cloudflare builds production, then the guarded deploy step migrates and deploys. The reporter adds a separate Production comment to the PR whose merge commit matches that production build.
3. Delete the retired Git branch. The cleanup workflow below removes its preview database generations after 20 minutes.

Preview comments apply only to the current head of an open repository PR. A production build without a matching merged PR appears in the reporter's Actions summary. Older attempts do not overwrite newer reports. The workflow and trusted reporter code must be on the default branch before automatic PR events can run. GitHub can suppress `check_run` triggers under its recursion/head-SHA rules; the push/PR observer handles the normal flow independently. If a build queues beyond the 30-minute observer timeout, use **Run workflow** with the native Cloudflare `check_run_id` to backfill its completed result. See [GitHub's check-run trigger constraints](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#check_run).

### Optional GitHub cleanup

The workflow in `.github/workflows/neon-preview-cleanup.yml` runs when a repository Git branch is deleted, waits 20 minutes for in-flight builds to finish, and removes its Neon build branches. Closing a PR alone does not trigger cleanup. It does not deploy to Cloudflare. Keep the existing GitHub Actions secret `NEON_API_KEY` and variables `NEON_PROJECT_ID` and `NEON_PARENT_BRANCH_ID` if using this cleanup. No `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, or `PREVIEW_ENV_JSON` is required in GitHub.

Cleanup verifies the dev parent and deletes only matching unprotected preview database branches. Cancel outstanding Cloudflare builds before deleting a Git branch: a queued or manually started build after the grace period can create another database that needs later cleanup. A Cloudflare Preview that still points to a deleted database can no longer serve database-backed requests; remove unused previews in Cloudflare too. Delete retired Git branches to release their accumulated Neon branches.

### Preview domains and authentication

The production Worker owns `invoicely.gg`. Its preview-only custom domain is `preview.invoicely.gg`; use the branch Preview URL reported by Cloudflare. These routes are checked into Wrangler configuration, with production and preview `workers.dev` URLs disabled. The optional staging Worker retains its `workers.dev` URL and has no custom domains. Cloudflare manages domain DNS and certificates; initial preview certificate issuance may take time. See [custom preview domains](https://developers.cloudflare.com/workers/previews/custom-domains/).

Browser auth and tRPC requests use the current preview origin. Preview server auth derives the HTTPS allowlist `*.preview.invoicely.gg` from `BETTER_AUTH_URL=https://invoicely.gg`; no Worker name or account subdomain is hardcoded in auth. Keep that canonical value in preview build and runtime settings. Production auth uses it directly. The public production URL variables remain canonical metadata and server fallback URLs. Custom preview HTML, API responses, and static assets receive `X-Robots-Tag: noindex`; production does not. If the canonical domain changes, update Wrangler routes and the preview header rules with it.

Google login uses Better Auth's [OAuth proxy](https://better-auth.com/docs/plugins/oauth-proxy) through the existing authorized `https://invoicely.gg/api/auth/callback/google` callback, then creates the session on the preview origin. Deploy this auth version to the application serving `https://invoicely.gg` before testing preview sign-in, even if that application is still hosted on Vercel. Production and previews must use the same Better Auth version and `BETTER_AUTH_SECRET`, along with the existing Google credentials. No per-preview Google callback registration is needed after the production proxy is available. Keep automatic builds limited to trusted repository branches because these previews use shared authentication credentials.

The hosted Preview command populates the build-time Next.js cache into the Preview's own static assets, then runs `wrangler preview`. Unlike production, this cache is read-only: previews support the current static pages and dynamic request handling, but do not perform ISR or background revalidation. Revisit this configuration if server-side timed revalidation or `revalidatePath`/`revalidateTag` is added. Preview caches have no R2 or Durable Object queue bindings; a [Preview service binding targets production](https://developers.cloudflare.com/workers/previews/resources/#service-bindings), so the production self-reference must not be copied into the preview configuration.

### Local and manual previews

`yarn preview:cloudflare` remains the local Workers development command. It uses the database selected by the local `.env`; it does not provision a Neon branch.

For a manual hosted preview, first provision an isolated database, apply its migrations, and configure its application build values. Then build and upload with that same database URL in a temporary secrets file, using a name distinct from Git branch Preview names:

```sh
CLOUDFLARE_PREVIEW=true yarn build:cloudflare
CLOUDFLARE_PREVIEW=true yarn workspace web deploy:cloudflare:preview \
  --name manual-your-name --secrets-file /absolute/path/preview-secrets.json
```

The secrets file must contain the same `DATABASE_URL` used during the build. New manual previews inherit the other configured [Preview Base secrets](https://developers.cloudflare.com/workers/previews/configuration/); subsequent Base changes do not update existing previews. Keep the temporary secrets file outside the repository and remove it after deployment. Automatic Neon provisioning and the validated database handoff run only inside native Cloudflare preview builds; local commands require you to prepare and supply the isolated database yourself.

## Required preview checks

A successful build or Wrangler dry run does not establish that authenticated application flows work on Cloudflare. Validate these on a deployed PR Preview (or the optional staging Worker) before switching the production domain:

- Landing pages, blog pages, unknown blog slugs, and missing-page responses.
- Google login, session persistence/refresh, and logout.
- Saving, loading, updating, and deleting an invoice; saved invoice defaults; local invoice migration.
- Uploading, listing, displaying, and deleting logos and signatures in the preview R2 asset bucket.
- PDF preview and download, including CJK fonts and invoices spanning several pages.
- Optimized images, generated Open Graph images, PostHog `/ingest` requests, and Sentry reporting/source maps.
- Worker logs, startup time, request CPU usage, and error rates under representative traffic.

Compare Wrangler's uncompressed `Total Upload` with the [current Worker size limit](https://developers.cloudflare.com/workers/platform/limits/#worker-size). As of October 2026, the limit is 64 MiB for both Free and Paid plans; compressed size is informational. Select a plan using measured request CPU usage and traffic, and account for R2 and Images separately.

## Production cutover and rollback

1. Complete preview validation and retain the working Vercel deployment for rollback.
2. Set production build/runtime values. Preserve the existing Neon database, R2 asset bucket, public asset domain, object keys, and `BETTER_AUTH_SECRET`.
3. Keep `NEXT_PUBLIC_BASE_URL` and `BETTER_AUTH_URL` at `https://invoicely.gg`, and `NEXT_PUBLIC_TRPC_BASE_URL` at `https://invoicely.gg/api/trpc`. Keep the existing Google OAuth callback authorized. Preserving the browser origin retains access to locally stored IndexedDB invoices and keeps auth cookie scope consistent.
4. Merge the validated change into `main` and let native Workers Builds run the production build and guarded migration/deployment sequence above. The checked-in routes attach `invoicely.gg` for production and `preview.invoicely.gg` for previews only. When moving from another host, remove only its conflicting DNS records before attaching the domains; preserve email, storage, and unrelated records. A staging deployment explicitly has no custom domains.
5. After routing changes, verify production login, saved invoices, existing assets, local invoices, and PDF generation. Disable automatic Vercel production deployments once the cutover is confirmed.

To roll back, restore the previous domain routing to the retained Vercel deployment. Keep the same database, asset storage, auth secret, and public origin during rollback. Database migrations are not reversed automatically; the restored application must remain compatible with the current schema.
