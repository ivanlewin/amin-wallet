# Amin Wallet

Personal wallet app built on the Next.js App Router, Clerk authentication, Drizzle ORM, and PlanetScale Postgres.

## Stack

- Next.js 16 App Router with server components by default
- Clerk for authentication
- Drizzle ORM + Drizzle Kit for schema and migrations
- PlanetScale Postgres for hosted development and production
- local PostgreSQL 18 for fast day-to-day development
- Vercel for hosting

## Environment

Required app variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `DATABASE_URL_DIRECT`

Use `DATABASE_URL` for runtime app traffic.

Use `DATABASE_URL_DIRECT` for migrations and DDL.

When you point the app at PlanetScale Postgres:

- `DATABASE_URL` should use the pooled PgBouncer connection on port `6432`
- `DATABASE_URL_DIRECT` should use the direct connection on port `5432`

When you point the app at local Postgres:

- `DATABASE_URL` and `DATABASE_URL_DIRECT` can both use the same local direct URL

The repo can also derive a connection URL from standard `PG*` variables:

- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`
- `PGSSLMODE`
- `PGSSLROOTCERT`

That matters because `psql` can use `service=...`, but the Next app and `drizzle-kit` still need a real URL or `PG*` variables.

## Development Targets

There are three database targets worth treating separately:

1. local Postgres on `127.0.0.1:54342` via `service=amin_wallet_dev`
2. PlanetScale Postgres branch `dev` for hosted validation
3. PlanetScale Postgres branch `main` for production

The recommended default is:

1. local first
2. hosted `dev` second
3. hosted `main` last

## PlanetScale Branch Model

- Production database: `ivanlewin/amin-wallet` branch `main`
- Development database: `ivanlewin/amin-wallet` branch `dev`
- Vercel Production env -> `main`
- Vercel Preview env -> `dev`
- Local development env -> local Postgres on `54342`

Create the PlanetScale development branch before the first hosted migration:

```bash
pscale auth login
pscale branch create amin-wallet dev --org ivanlewin --from main --wait
```

Create separate application and migration roles on the `dev` branch instead of using the default `postgres` role from app code:

```bash
pscale role create amin-wallet dev amin_wallet_app --org ivanlewin --inherited-roles pg_read_all_data,pg_write_all_data
pscale role create amin-wallet dev amin_wallet_migrate --org ivanlewin --inherited-roles postgres
```

Do the same on `main`, but keep the production password out of `~/.pgpass`.

## Local Workflow

Install dependencies:

```bash
pnpm install
```

Start the dedicated local Postgres 18 cluster that backs `service=amin_wallet_dev`:

```bash
pnpm db:local:start
pnpm db:local:status
psql "service=amin_wallet_dev" -c "select current_database(), current_user;"
```

That helper manages the dedicated Amin Wallet data directory at `/opt/homebrew/var/postgresql@18-amin-wallet`.

Reset the local cluster back to an empty state:

```bash
pnpm db:local:reset
pnpm db:migrate
pnpm db:status
```

For this machine, local development uses:

```bash
DATABASE_URL=postgresql://postgres@127.0.0.1:54342/postgres
DATABASE_URL_DIRECT=postgresql://postgres@127.0.0.1:54342/postgres
```

Apply migrations locally:

```bash
pnpm db:migrate
pnpm db:status
```

Run the app:

```bash
pnpm dev
```

Open [http://localhost:3100](http://localhost:3100).

## Database Workflow

Generate SQL from the Drizzle schema:

```bash
pnpm db:generate -- --name add_wallet_field
```

Apply pending migrations to the current target:

```bash
pnpm db:migrate
```

Check that schema snapshots and migrations are aligned:

```bash
pnpm db:check
```

Show which migrations have been applied to the current target:

```bash
pnpm db:status
```

Introspect the current target database back into a Drizzle schema:

```bash
pnpm db:introspect
```

Push the current schema directly without a migration file:

```bash
pnpm db:push
```

Open Drizzle Studio:

```bash
pnpm db:studio
```

Important:

- Use `pnpm db:push` only against disposable local databases.
- Do not run migrations automatically from page renders or request handlers.
- Apply migrations intentionally to local first, then `dev`, then `main`.
- For PlanetScale Postgres, do not rely on branch promotion to move schema changes from `dev` to `main`. Apply the same migration files to each branch explicitly.

## GitHub Actions

This repo includes a GitHub Actions setup modeled after the `mod` project, but adapted for Drizzle plus PlanetScale Postgres:

- `.github/workflows/ci.yaml` runs on pull requests and validates the migration set against a disposable PostgreSQL 18 service.
- `.github/workflows/development.yaml` runs on pushes to `dev` and applies committed Drizzle migrations to the PlanetScale `dev` branch.
- `.github/workflows/production.yaml` runs on pushes to `main` and applies committed Drizzle migrations to the PlanetScale `main` branch.

Required GitHub repository secrets:

- `PLANETSCALE_DEV_DATABASE_URL_DIRECT`
- `PLANETSCALE_PRODUCTION_DATABASE_URL_DIRECT`

These should be direct PlanetScale Postgres connection strings on port `5432`, not PgBouncer URLs.

Why this does not use PlanetScale deploy requests:

- PlanetScale's GitHub Actions documentation is built around the Vitess deploy-request workflow.
- PlanetScale Postgres branches do not use deploy requests.
- PlanetScale Postgres currently requires you to apply the same schema changes separately to each branch.

So for Amin Wallet, the reliable workflow is:

1. validate the migration locally in CI
2. run `pnpm db:migrate` against PlanetScale `dev`
3. run the same committed migration files against PlanetScale `main`

## Switching Targets With `~/.pg_service.conf`

`psql` can already use your service definitions directly:

```bash
psql "service=amin_wallet_dev"
psql "service=amin_wallet_production"
```

For `drizzle-kit` and the Next app, use the helper that converts a service entry into `PG*`, `DATABASE_URL`, and `DATABASE_URL_DIRECT`:

```bash
eval "$(pnpm --silent run db:env -- amin_wallet_dev)"
pnpm db:status
```

Print only the resolved URL:

```bash
pnpm --silent run db:url -- amin_wallet_dev
```

If the service password is not stored in `~/.pgpass`, export it temporarily before calling `db:env`:

```bash
export PGPASSWORD="<paste-password>"
eval "$(pnpm --silent run db:env -- amin_wallet_production)"
pnpm db:status
unset PGPASSWORD
```

That matches the intended safety model:

- local and hosted `dev` can live in `~/.pgpass`
- production can prompt in `psql`, or use a temporary `PGPASSWORD` or `DATABASE_URL_DIRECT` only when you intentionally run a production migration

## Comparing Databases

Compare the PlanetScale `dev` branch against its parent branch:

```bash
pscale branch diff amin-wallet dev --org ivanlewin
```

Inspect a branch schema from PlanetScale:

```bash
pscale branch schema amin-wallet dev --org ivanlewin --namespace postgres.public
```

Compare any target database against the codebase by introspecting it and reviewing the generated output:

```bash
eval "$(pnpm --silent run db:env -- amin_wallet_dev)"
pnpm db:introspect
```

## Supabase Mental Model

If you're used to Supabase CLI, the closest equivalents here are:

- `supabase migration new` -> `pnpm db:generate -- --name <name>`
- `supabase migration up` -> `pnpm db:migrate`
- `supabase migration list` -> `pnpm db:status`
- `supabase db diff` -> `pnpm db:introspect` or `pscale branch diff ...`
- `supabase db push` -> `pnpm db:push` for local throwaway databases only

## Recommended Flow

1. Change `lib/db/schema.ts`.
2. Generate a named migration with `pnpm db:generate -- --name <change>`.
3. Apply it locally with `pnpm db:migrate`.
4. Verify with `pnpm db:status`, `pnpm db:check`, and `pnpm dev`.
5. Apply the same migration files to PlanetScale `dev`.
6. Validate there.
7. Apply the same migration files to PlanetScale `main`.

## Current App Shape

- `/` is a public landing page.
- `/sign-in` and `/sign-up` are Clerk-powered auth routes.
- `/dashboard` is the protected server-rendered app shell.

The database includes the MoneyWallet-inspired core model:

- `users`
- `currencies`
- `wallets`
- `categories`
- `events`
- `debts`
- `recurrent_transactions`
- `transaction_models`
- `transactions`
- `transfer_models`
- `transfers`

## Verification

The current foundation has been verified with:

```bash
pnpm db:generate
pnpm db:check
pnpm db:status
pnpm typecheck
pnpm lint
pnpm build
```
