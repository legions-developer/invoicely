# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root (Turbo orchestrates the workspaces):

```bash
bun run dev            # Start all apps in dev (Next.js with --turbopack)
bun run build          # Production build of all apps
bun run start          # Start production servers
bun run lint           # Lint all packages
bun run lint:fix       # eslint . --fix
bun run format         # prettier --write across the repo
bun run check-types    # Type-check via turbo
bun run test           # Bun tests for CLI and shared invoice domain
bun run invoice help   # Agent-oriented invoice CLI

# Database (Drizzle + PostgreSQL) — all read DATABASE_URL via dotenv-cli
bun run db:up          # Start local PostgreSQL 17 + Adminer and wait for health
bun run db:down        # Stop local database services without deleting data
bun run db:logs        # Follow local PostgreSQL logs
bun run db:check       # Verify application-level database connectivity
bun run db:generate    # Generate SQL migrations from schema changes
bun run db:migrate     # Apply migrations
bun run db:push        # Push schema directly (dev only)
bun run db:studio      # Open Drizzle Studio
```

Tests use Bun's built-in runner and are orchestrated by Turbo. Keep fixtures synthetic; never commit personal invoice or template data.

### First-time setup gotcha

Environment variables live in a single root `.env`. Run `bun run sys-link` to symlink it into each app under `apps/*` (see `env-links.sh`). The dev server will fail env validation without this step. Env is validated by Zod via `@t3-oss/env-nextjs` in `packages/utilities/src/env`; add new vars there **and** to `turbo.json`'s `build.env` list if they're needed at build time.

## Architecture

Bun 1.4 workspaces + Turborepo monorepo:

- `apps/web` — the Next.js 15 App Router application
- `apps/cli` — Bun CLI for template management, validation, serial reservation, and PDF output
- `packages/db` — Drizzle ORM schema, migrations, and the Postgres.js client (`@invoicely/db`)
- `packages/invoice-core` — shared Zod schemas, template model, serial logic, and Decimal-backed calculations
- `packages/invoice-pdf` — shared React PDF components plus separate browser Blob and Bun/Node buffer entry points
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

CLI named templates live in `local_invoice_templates`. Repository APIs reject non-loopback database hosts unless `INVOICELY_ALLOW_REMOTE_TEMPLATES=true`; keep that opt-in explicit. Apply this development-only table with `bun run db:push` and do not commit generated migration artifacts.

Auth uses **Better Auth** with the Drizzle adapter and Google OAuth (`lib/auth.ts` server / `lib/client-auth.ts` client). Custom model names (`users`/`accounts`/`sessions`/`verifications`) and `generateId: false` (the app supplies UUIDs). Route handler at `app/api/auth/[...all]/route.ts`.

### PDF generation

Invoices render to PDF with `@react-pdf/renderer` / `react-pdf`. Shared PDF components and browser/Bun render entry points live in `packages/invoice-pdf`; the web app keeps image conversion helpers under `lib/invoice` and configures PDF preview workers in `providers/pdf-worker-provider.tsx`. Templates are keyed by name (`default`, `vercel`) in the shared invoice theme.

### Marketing / blog

Uses `fumadocs-ui` + `content-collections` (MDX). Content sources are in `apps/web/src/content`, configured in `apps/web/content-collections.ts`.

## Conventions (enforced by review — see `.cursor/rules` and README)

- **No default exports.** Declare then export: `const Foo = () => {}; export { Foo }`.
- Client components (`"use client"`) get a `.client.tsx` filename suffix.
- Zod schemas/types are prefixed `Zod` (e.g. `ZodCreateInvoiceSchema`); the schema object itself is `createInvoiceSchema`.
- Directories use `lowercase-with-dashes`. Use the `function` keyword for pure functions; prefer interfaces over types; avoid enums (use maps / `pgEnum`).
- Favor React Server Components; minimize `use client`, `useEffect`, `setState`.
- Commit/PR title format: `type(scope): description` (`feat:`, `fix:`, `chore:`). Branch names: `profilename/featurename`.
- The Husky pre-commit hook runs `turbo run lint -- --fix` then `bun run format`.

## Important constraints

- **Do not push or commit database migrations** — migrations are reviewed and managed by maintainers (per README).
- The project rejects low-quality / "vibe coded" PRs — keep changes deliberate and consistent with existing patterns.
