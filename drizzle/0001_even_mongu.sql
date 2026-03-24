ALTER TABLE "categories" RENAME COLUMN "is_deleted" TO "deleted";--> statement-breakpoint
ALTER TABLE "currencies" RENAME COLUMN "is_deleted" TO "deleted";--> statement-breakpoint
ALTER TABLE "debts" RENAME COLUMN "is_archived" TO "archived";--> statement-breakpoint
ALTER TABLE "debts" RENAME COLUMN "is_deleted" TO "deleted";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "is_deleted" TO "deleted";--> statement-breakpoint
ALTER TABLE "recurrent_transactions" RENAME COLUMN "is_confirmed" TO "confirmed";--> statement-breakpoint
ALTER TABLE "recurrent_transactions" RENAME COLUMN "is_deleted" TO "deleted";--> statement-breakpoint
ALTER TABLE "transaction_models" RENAME COLUMN "is_confirmed" TO "confirmed";--> statement-breakpoint
ALTER TABLE "transaction_models" RENAME COLUMN "is_deleted" TO "deleted";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "is_confirmed" TO "confirmed";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "is_deleted" TO "deleted";--> statement-breakpoint
ALTER TABLE "transfer_models" RENAME COLUMN "is_confirmed" TO "confirmed";--> statement-breakpoint
ALTER TABLE "transfer_models" RENAME COLUMN "is_deleted" TO "deleted";--> statement-breakpoint
ALTER TABLE "transfers" RENAME COLUMN "is_confirmed" TO "confirmed";--> statement-breakpoint
ALTER TABLE "transfers" RENAME COLUMN "is_deleted" TO "deleted";--> statement-breakpoint
ALTER TABLE "wallets" RENAME COLUMN "is_archived" TO "archived";--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_range_valid";--> statement-breakpoint
ALTER TABLE "transfer_models" DROP CONSTRAINT "transfer_models_wallets_distinct";--> statement-breakpoint
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_wallets_distinct";--> statement-breakpoint
DROP INDEX "wallets_user_id_name_unique";--> statement-breakpoint
ALTER TABLE "transfers" DROP COLUMN "from_amount";--> statement-breakpoint
ALTER TABLE "transfers" DROP COLUMN "to_amount";--> statement-breakpoint
ALTER TABLE "transfers" DROP COLUMN "fee_amount";--> statement-breakpoint
ALTER TABLE "wallets" DROP COLUMN "is_deleted";