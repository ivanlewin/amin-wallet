ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "currencies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "debts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recurrent_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transaction_models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transfer_models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "categories_current_user_all" ON "categories" AS PERMISSIVE FOR ALL TO public USING ("categories"."user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("categories"."user_id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "currencies_public_select" ON "currencies" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "debts_owned_wallet_all" ON "debts" AS PERMISSIVE FOR ALL TO public USING (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "debts"."wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  )) WITH CHECK (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "debts"."wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ));--> statement-breakpoint
CREATE POLICY "events_current_user_all" ON "events" AS PERMISSIVE FOR ALL TO public USING ("events"."user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("events"."user_id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "recurrent_transactions_owned_wallet_all" ON "recurrent_transactions" AS PERMISSIVE FOR ALL TO public USING (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "recurrent_transactions"."wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  )) WITH CHECK (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "recurrent_transactions"."wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ));--> statement-breakpoint
CREATE POLICY "transaction_models_owned_wallet_all" ON "transaction_models" AS PERMISSIVE FOR ALL TO public USING (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transaction_models"."wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  )) WITH CHECK (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transaction_models"."wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ));--> statement-breakpoint
CREATE POLICY "transactions_owned_wallet_all" ON "transactions" AS PERMISSIVE FOR ALL TO public USING (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transactions"."wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  )) WITH CHECK (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transactions"."wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ));--> statement-breakpoint
CREATE POLICY "transfer_models_owned_wallets_all" ON "transfer_models" AS PERMISSIVE FOR ALL TO public USING (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transfer_models"."from_wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ) and exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transfer_models"."to_wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  )) WITH CHECK (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transfer_models"."from_wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ) and exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transfer_models"."to_wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ));--> statement-breakpoint
CREATE POLICY "transfers_owned_wallets_all" ON "transfers" AS PERMISSIVE FOR ALL TO public USING (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transfers"."from_wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ) and exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transfers"."to_wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  )) WITH CHECK (exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transfers"."from_wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ) and exists (
    select 1
    from "wallets"
    where "wallets"."id" = "transfers"."to_wallet_id"
      and "wallets"."user_id" = current_setting('app.current_user_id', true)
  ));--> statement-breakpoint
CREATE POLICY "users_current_user_all" ON "users" AS PERMISSIVE FOR ALL TO public USING ("users"."id" = current_setting('app.current_user_id', true)) WITH CHECK ("users"."id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "wallets_current_user_all" ON "wallets" AS PERMISSIVE FOR ALL TO public USING ("wallets"."user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("wallets"."user_id" = current_setting('app.current_user_id', true));