<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Database And Migration Rules

- Never run migrations directly against the database with `psql`, raw SQL files, or any manual database command unless the user explicitly instructs that exact action.
- Never alter the migration process manually.
- Never write migration files by hand unless the user explicitly asks for a manual migration.
- Always use the package scripts for database work so Drizzle remains the source of truth.
- Use `pnpm db:generate` to generate migrations.
- Use `pnpm db:migrate` to apply migrations through Drizzle.
- Use `pnpm db:check` to verify Drizzle migration state.
- Use `pnpm db:push` only when the user explicitly wants a push-based schema change instead of a generated migration.
- Prefer the scripts defined in [`package.json`](/Users/ivan/projects/amin-wallet/package.json) over any direct database command.
- If a database task cannot be completed through the package scripts, stop and ask the user before doing anything manual.
