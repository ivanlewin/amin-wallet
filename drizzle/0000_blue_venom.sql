CREATE TYPE "public"."category_tag" AS ENUM('transfer', 'transfer_tax', 'debt', 'paid_debt', 'credit', 'paid_credit', 'tax', 'deposit', 'withdraw');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('income', 'expense', 'system');--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
CREATE OR REPLACE FUNCTION nanoid(
	"size" int DEFAULT 21,
	"alphabet" text DEFAULT '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
	"additional_bytes_factor" float DEFAULT 1.6
) RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
	alphabet_array text[];
	alphabet_length int := 64;
	mask int := 63;
	step int := 34;
BEGIN
	IF size IS NULL OR size < 1 THEN
		RAISE EXCEPTION 'The size must be defined and greater than 0.';
	END IF;

	IF alphabet IS NULL OR length(alphabet) = 0 OR length(alphabet) > 255 THEN
		RAISE EXCEPTION 'The alphabet cannot be undefined, empty, or larger than 255 symbols.';
	END IF;

	IF additional_bytes_factor IS NULL OR additional_bytes_factor < 1 THEN
		RAISE EXCEPTION 'The additional bytes factor cannot be less than 1.';
	END IF;

	alphabet_array := regexp_split_to_array(alphabet, '');
	alphabet_length := array_length(alphabet_array, 1);
	mask := (2 << cast(floor(log(alphabet_length - 1) / log(2)) as int)) - 1;
	step := cast(ceil(additional_bytes_factor * mask * size / alphabet_length) AS int);

	IF step > 1024 THEN
		step := 1024;
	END IF;

	RETURN public.nanoid_optimized(size, alphabet, mask, step);
END
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION nanoid_optimized(
	"size" int,
	"alphabet" text,
	"mask" int,
	"step" int
) RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
	id_builder text := '';
	counter int := 0;
	bytes bytea;
	alphabet_index int;
	alphabet_array text[];
	alphabet_length int := 64;
BEGIN
	alphabet_array := regexp_split_to_array(alphabet, '');
	alphabet_length := array_length(alphabet_array, 1);

	LOOP
		bytes := gen_random_bytes(step);
		FOR counter IN 0..step - 1 LOOP
			alphabet_index := (get_byte(bytes, counter) & mask) + 1;
			IF alphabet_index <= alphabet_length THEN
				id_builder := id_builder || alphabet_array[alphabet_index];
				IF length(id_builder) = size THEN
					RETURN id_builder;
				END IF;
			END IF;
		END LOOP;
	END LOOP;
END
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION new_id("prefix" text DEFAULT '', "size" int DEFAULT 18) RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
	generated_id text;
BEGIN
	SELECT public.nanoid(size, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') INTO generated_id;

	IF prefix = '' THEN
		RETURN generated_id;
	END IF;

	RETURN prefix || '_' || generated_id;
END
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION update_last_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.last_updated_at = now();
	RETURN NEW;
END
$$;--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY DEFAULT new_id('catg') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" jsonb NOT NULL,
	"type" "category_type" NOT NULL,
	"tag" "category_tag",
	"include_in_reports" boolean DEFAULT true NOT NULL,
	"index" smallint DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"parent_id" text,
	CONSTRAINT "categories_index_positive" CHECK ("categories"."index" >= 0)
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" text PRIMARY KEY DEFAULT new_id('curr') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"symbol" text NOT NULL,
	"decimals" smallint NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" text PRIMARY KEY DEFAULT new_id('debt') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"icon" jsonb NOT NULL,
	"description" text,
	"paid_at" timestamp with time zone NOT NULL,
	"wallet_id" text NOT NULL,
	"note" text,
	"amount" bigint NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY DEFAULT new_id('evnt') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" jsonb NOT NULL,
	"note" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "events_range_valid" CHECK ("events"."end_at" >= "events"."start_at")
);
--> statement-breakpoint
CREATE TABLE "recurrent_transactions" (
	"id" text PRIMARY KEY DEFAULT new_id('rctx') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" bigint NOT NULL,
	"description" text,
	"category_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"note" text,
	"is_confirmed" boolean DEFAULT true NOT NULL,
	"include_in_total" boolean DEFAULT true NOT NULL,
	"recurrence_start_at" timestamp with time zone NOT NULL,
	"recurrence_end_at" timestamp with time zone,
	"recurrence_rules" text[],
	"recurrence_exdates" timestamp with time zone[],
	"recurrence_rdates" timestamp with time zone[],
	"last_occurrence_at" timestamp with time zone,
	"next_occurrence_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_models" (
	"id" text PRIMARY KEY DEFAULT new_id('txmd') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" bigint,
	"description" text,
	"category_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"note" text,
	"is_confirmed" boolean DEFAULT true NOT NULL,
	"include_in_total" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY DEFAULT new_id('tnsx') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" bigint NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"category_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"note" text,
	"is_confirmed" boolean DEFAULT true NOT NULL,
	"include_in_total" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_from_model_id" text
);
--> statement-breakpoint
CREATE TABLE "transfer_models" (
	"id" text PRIMARY KEY DEFAULT new_id('tfmd') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"from_wallet_id" text NOT NULL,
	"to_wallet_id" text NOT NULL,
	"from_amount" bigint,
	"to_amount" bigint,
	"fee_amount" bigint,
	"note" text,
	"is_confirmed" boolean DEFAULT true NOT NULL,
	"include_in_total" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "transfer_models_wallets_distinct" CHECK ("transfer_models"."from_wallet_id" <> "transfer_models"."to_wallet_id")
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" text PRIMARY KEY DEFAULT new_id('tnsf') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"from_wallet_id" text NOT NULL,
	"to_wallet_id" text NOT NULL,
	"from_amount" bigint NOT NULL,
	"to_amount" bigint NOT NULL,
	"fee_amount" bigint DEFAULT 0 NOT NULL,
	"note" text,
	"is_confirmed" boolean DEFAULT true NOT NULL,
	"include_in_total" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_from_model_id" text,
	CONSTRAINT "transfers_wallets_distinct" CHECK ("transfers"."from_wallet_id" <> "transfers"."to_wallet_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"emails" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text NOT NULL,
	"phone_number" text,
	"phone_numbers" text[],
	"public_metadata" jsonb,
	"unsafe_metadata" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY DEFAULT new_id('wllt') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" jsonb NOT NULL,
	"currency_id" text NOT NULL,
	"initial_balance" bigint DEFAULT 0 NOT NULL,
	"count_in_total" boolean DEFAULT true NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"index" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "wallets_index_positive" CHECK ("wallets"."index" >= 0)
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrent_transactions" ADD CONSTRAINT "recurrent_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrent_transactions" ADD CONSTRAINT "recurrent_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction_models" ADD CONSTRAINT "transaction_models_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction_models" ADD CONSTRAINT "transaction_models_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_from_model_id_transaction_models_id_fk" FOREIGN KEY ("created_from_model_id") REFERENCES "public"."transaction_models"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transfer_models" ADD CONSTRAINT "transfer_models_from_wallet_id_wallets_id_fk" FOREIGN KEY ("from_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transfer_models" ADD CONSTRAINT "transfer_models_to_wallet_id_wallets_id_fk" FOREIGN KEY ("to_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_wallet_id_wallets_id_fk" FOREIGN KEY ("from_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_wallet_id_wallets_id_fk" FOREIGN KEY ("to_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_created_from_model_id_transfer_models_id_fk" FOREIGN KEY ("created_from_model_id") REFERENCES "public"."transfer_models"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_id_tag_unique" ON "categories" USING btree ("user_id","tag");--> statement-breakpoint
CREATE UNIQUE INDEX "currencies_code_unique" ON "currencies" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_user_id_name_unique" ON "wallets" USING btree ("user_id","name");--> statement-breakpoint
CREATE OR REPLACE FUNCTION check_category_parent_not_nested() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF NEW.parent_id IS NULL THEN
		RETURN NEW;
	END IF;

	IF NEW.parent_id = NEW.id THEN
		RAISE EXCEPTION 'A category cannot be its own parent.';
	END IF;

	IF (SELECT parent_id FROM "categories" WHERE id = NEW.parent_id) IS NOT NULL THEN
		RAISE EXCEPTION 'Categories cannot be nested more than once.';
	END IF;

	RETURN NEW;
END
$$;--> statement-breakpoint
CREATE TRIGGER check_category_parent_not_nested
BEFORE INSERT OR UPDATE ON "categories"
FOR EACH ROW
EXECUTE FUNCTION check_category_parent_not_nested();--> statement-breakpoint
CREATE TRIGGER update_categories_last_updated_at
BEFORE UPDATE ON "categories"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
CREATE TRIGGER update_currencies_last_updated_at
BEFORE UPDATE ON "currencies"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
CREATE TRIGGER update_debts_last_updated_at
BEFORE UPDATE ON "debts"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
CREATE TRIGGER update_events_last_updated_at
BEFORE UPDATE ON "events"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
CREATE TRIGGER update_recurrent_transactions_last_updated_at
BEFORE UPDATE ON "recurrent_transactions"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
CREATE TRIGGER update_transaction_models_last_updated_at
BEFORE UPDATE ON "transaction_models"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
CREATE TRIGGER update_transactions_last_updated_at
BEFORE UPDATE ON "transactions"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
CREATE TRIGGER update_transfer_models_last_updated_at
BEFORE UPDATE ON "transfer_models"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
CREATE TRIGGER update_transfers_last_updated_at
BEFORE UPDATE ON "transfers"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
CREATE TRIGGER update_wallets_last_updated_at
BEFORE UPDATE ON "wallets"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_at();--> statement-breakpoint
INSERT INTO "currencies" ("name", "code", "symbol", "decimals", "is_deleted")
VALUES
	('Argentine Peso', 'ARS', '$', 2, false),
	('US Dollar', 'USD', '$', 2, false),
	('Euro', 'EUR', '€', 2, false),
	('Brazilian Real', 'BRL', 'R$', 2, false),
	('Pound Sterling', 'GBP', '£', 2, false),
	('Tether', 'USDT', '₮', 2, false)
ON CONFLICT ("code") DO NOTHING;
