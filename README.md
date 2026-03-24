# Amin Wallet

Personal wallet app built on the Next.js App Router, Clerk authentication, Drizzle ORM, and PlanetScale Postgres.

## Stack

- Next.js 16 App Router with server components by default
- Clerk for authentication
- Drizzle ORM + Drizzle Kit for schema and migrations
- PlanetScale Postgres for production and development branches
- Vercel for hosting

## Environment
Required variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `DATABASE_URL_DIRECT`

Use `DATABASE_URL` for runtime app traffic through PlanetScale PgBouncer.

Use `DATABASE_URL_DIRECT` for migrations and DDL against the direct Postgres connection.

## PlanetScale Branch Model

- Production database: `ivanlewin/amin-wallet` branch `main`
- Development database: `ivanlewin/amin-wallet` branch `dev`
- Vercel Production env -> `main`
- Vercel Preview env -> `dev`
- Local development env -> `dev`

Create the development branch before the first migration:

```bash
pscale auth login
pscale branch create amin-wallet dev --org ivanlewin --from main --wait
```

## Local Workflow

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

Open [http://localhost:3100](http://localhost:3100).

## Database Workflow

Generate SQL from the Drizzle schema:

```bash
pnpm db:generate
```

Check that schema snapshots and migrations are aligned:

```bash
pnpm db:check
```

Apply migrations to the database pointed to by `DATABASE_URL_DIRECT`:

```bash
pnpm db:migrate
```

Open Drizzle Studio:

```bash
pnpm db:studio
```

Important:

- Do not use `drizzle-kit push` against shared or production branches.
- Do not run migrations automatically from page renders or request handlers.
- Apply migrations intentionally against `dev`, validate there, then promote the same migration set to `main`.

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
pnpm typecheck
pnpm lint
pnpm build
```

