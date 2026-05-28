# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root (Turbo orchestrates the workspaces):

```bash
yarn dev            # Start all apps in dev (Next.js with --turbopack)
yarn build          # Production build of all apps
yarn start          # Start production servers
yarn lint           # Lint all packages
yarn lint:fix       # eslint . --fix
yarn format         # prettier --write across the repo
yarn check-types    # Type-check via turbo

# Database (Drizzle + Neon Postgres) — all read DATABASE_URL via dotenv-cli
yarn db:generate    # Generate SQL migrations from schema changes
yarn db:migrate     # Apply migrations
yarn db:push        # Push schema directly (dev only)
yarn db:studio      # Open Drizzle Studio
```

There is **no test runner** configured in this repo — do not assume `yarn test` exists.

### First-time setup gotcha

Environment variables live in a single root `.env`. Run `yarn sys-link` to symlink it into each app under `apps/*` (see `env-links.sh`). The dev server will fail env validation without this step. Env is validated by Zod via `@t3-oss/env-nextjs` in `packages/utilities/src/env`; add new vars there **and** to `turbo.json`'s `build.env` list if they're needed at build time.

## Architecture

Yarn 4 workspaces + Turborepo monorepo:

- `apps/web` — the Next.js 15 App Router application (the only app)
- `packages/db` — Drizzle ORM schema, migrations, and the Neon Postgres client (`@invoicely/db`)
- `packages/utilities` — shared env config (`@invoicely/utilities`)
- `packages/eslint-config`, `packages/typescript-config` — shared config

Path aliases in `apps/web`: `@/*` → `src/*`, `@/icons` → `src/assets/icons`.

### Local-first invoices (the core domain model)

Invoices are created and stored **client-side in IndexedDB** by default — see `global/indexdb`, `lib/indexdb-queries`, and `constants/indexed-db.ts` (uses the `idb` library). The `invoiceTypeEnum` (`local` | `server`) distinguishes these.

Authenticated users can **migrate** local invoices into Postgres via the `invoice.migrateToDb` tRPC mutation. This is gated by the `allowedSavingData` boolean on the user (defaults to `false`, declared as a Better Auth `additionalField` in `lib/auth.ts`). Any write service checks `ctx.auth.user.allowedSavingData` before persisting.

### tRPC layer (note: "services", not "routers")

`apps/web/src/trpc`:

- `init.ts` — defines `baseProcedure`, `createTRPCRouter`, `middleware`; uses a superjson transformer.
- `procedures/authorizedProcedure.ts` — `baseProcedure` + `betterAuthMiddleware`, which injects `ctx.auth` (the Better Auth session) or throws `UNAUTHORIZED`.
- `middlewares/awsS3Middleware.ts` — injects `ctx.s3` (Cloudflare R2 via the S3 client) for storage procedures.
- `services/<domain>/` — **each procedure is its own file** (e.g. `services/invoice/insertInvoice.ts`), re-exported from the domain's `index.ts` router, which is composed in `routers/_app.ts`.

### Effect-based error handling (standard pattern for write services)

Mutations wrap their logic in `Effect.gen(function* () { ... })`, `yield*` tagged errors from `lib/effect/error/trpc.ts` (`ForbiddenError`, `NotFoundError`, `InternalServerError`, etc.), then `.pipe(Effect.catchTags({ ... }))` to map each tagged error onto a `TRPCError` with the right code, and finally `Effect.runPromise(...)`. Follow `services/invoice/insertInvoice.ts` as the canonical example when adding new procedures. External promises are wrapped with `Effect.tryPromise`, converting thrown errors via `parseCatchError`.

`lib/neverthrow` provides an alternative `asyncTryCatch` returning a `CustomResult` discriminated union (`{ success, data } | { success, error }`) used in non-Effect call sites.

### Database schema (heavily normalized)

`packages/db/src/schema/invoice.ts`: an `invoices` row owns one `invoiceFields` row, which fans out into `invoiceCompanyDetails`, `invoiceClientDetails`, `invoiceDetails`, `invoiceMetadata`, and many `invoiceItems` — each with their own child metadata tables. `lib/db-queries/invoice/insertInvoice.ts` writes these as **sequential inserts** (not a single transaction); replicate that ordering when extending it.

Money/amounts use **Decimal.js** end to end via the custom Drizzle `Numeric` type in `packages/db/src/custom/decimal.ts` (stores `numeric`, hydrates to `Decimal`). Never use JS floats for monetary values.

Auth uses **Better Auth** with the Drizzle adapter and Google OAuth (`lib/auth.ts` server / `lib/client-auth.ts` client). Custom model names (`users`/`accounts`/`sessions`/`verifications`) and `generateId: false` (the app supplies UUIDs). Route handler at `app/api/auth/[...all]/route.ts`.

### PDF generation

Invoices render to PDF with `@react-pdf/renderer` / `react-pdf`. PDF components live in `components/pdf`; `lib/invoice` holds base64/blob/image conversion helpers; `providers/pdf-worker-provider.tsx` sets up the worker. Templates are keyed by name (`default`, `vercel`) in the invoice theme.

### Marketing / blog

Uses `fumadocs-ui` + `content-collections` (MDX). Content sources are in `apps/web/src/content`, configured in `apps/web/content-collections.ts`.

## Conventions (enforced by review — see `.cursor/rules` and README)

- **No default exports.** Declare then export: `const Foo = () => {}; export { Foo }`.
- Client components (`"use client"`) get a `.client.tsx` filename suffix.
- Zod schemas/types are prefixed `Zod` (e.g. `ZodCreateInvoiceSchema`); the schema object itself is `createInvoiceSchema`.
- Directories use `lowercase-with-dashes`. Use the `function` keyword for pure functions; prefer interfaces over types; avoid enums (use maps / `pgEnum`).
- Favor React Server Components; minimize `use client`, `useEffect`, `setState`.
- Commit/PR title format: `type(scope): description` (`feat:`, `fix:`, `chore:`). Branch names: `profilename/featurename`.
- The Husky pre-commit hook runs `turbo run lint -- --fix` then `yarn format`.

## Important constraints

- **Do not push or commit database migrations** — migrations are reviewed and managed by maintainers (per README).
- The project rejects low-quality / "vibe coded" PRs — keep changes deliberate and consistent with existing patterns.
