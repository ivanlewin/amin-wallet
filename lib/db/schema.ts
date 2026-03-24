import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type ColorIcon = {
  type: "color";
  color: string;
  name: string;
};

export type ResourceIcon = {
  type: "resource";
  resource: string;
};

export type IconDefinition = ColorIcon | ResourceIcon;

export const categoryTypeEnum = pgEnum("category_type", ["income", "expense", "system"]);

export const categoryTagEnum = pgEnum("category_tag", [
  "transfer",
  "transfer_tax",
  "debt",
  "paid_debt",
  "credit",
  "paid_credit",
  "tax",
  "deposit",
  "withdraw",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  emails: text("emails").array().notNull().default(sql`ARRAY[]::text[]`),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url").notNull(),
  phoneNumber: text("phone_number"),
  phoneNumbers: text("phone_numbers").array(),
  publicMetadata: jsonb("public_metadata").$type<Record<string, unknown> | null>(),
  unsafeMetadata: jsonb("unsafe_metadata").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const currencies = pgTable(
  "currencies",
  {
    id: text("id").primaryKey().default(sql`new_id('curr')`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    symbol: text("symbol").notNull(),
    decimals: smallint("decimals").notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (table) => [uniqueIndex("currencies_code_unique").on(table.code)],
);

export const wallets = pgTable(
  "wallets",
  {
    id: text("id").primaryKey().default(sql`new_id('wllt')`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade", onDelete: "restrict" }),
    name: text("name").notNull(),
    icon: jsonb("icon").$type<IconDefinition>().notNull(),
    currencyId: text("currency_id")
      .notNull()
      .references(() => currencies.id, { onUpdate: "cascade", onDelete: "restrict" }),
    initialBalance: bigint("initial_balance", { mode: "bigint" }).notNull().default(sql`0`),
    countInTotal: boolean("count_in_total").notNull().default(true),
    isArchived: boolean("is_archived").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    sortIndex: smallint("index").notNull().default(0),
  },
  (table) => [
    check("wallets_index_positive", sql`${table.sortIndex} >= 0`),
    uniqueIndex("wallets_user_id_name_unique").on(table.userId, table.name),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey().default(sql`new_id('catg')`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade", onDelete: "restrict" }),
    name: text("name").notNull(),
    icon: jsonb("icon").$type<IconDefinition>().notNull(),
    type: categoryTypeEnum("type").notNull(),
    tag: categoryTagEnum("tag"),
    includeInReports: boolean("include_in_reports").notNull().default(true),
    sortIndex: smallint("index").notNull().default(0),
    isDeleted: boolean("is_deleted").notNull().default(false),
    parentId: text("parent_id"),
  },
  (table) => [
    check("categories_index_positive", sql`${table.sortIndex} >= 0`),
    uniqueIndex("categories_user_id_tag_unique").on(table.userId, table.tag),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "categories_parent_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey().default(sql`new_id('evnt')`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade", onDelete: "restrict" }),
    name: text("name").notNull(),
    icon: jsonb("icon").$type<IconDefinition>().notNull(),
    note: text("note"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (table) => [check("events_range_valid", sql`${table.endAt} >= ${table.startAt}`)],
);

export const debts = pgTable("debts", {
  id: text("id").primaryKey().default(sql`new_id('debt')`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
  icon: jsonb("icon").$type<IconDefinition>().notNull(),
  description: text("description"),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onUpdate: "cascade", onDelete: "restrict" }),
  note: text("note"),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  isArchived: boolean("is_archived").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export const recurrentTransactions = pgTable("recurrent_transactions", {
  id: text("id").primaryKey().default(sql`new_id('rctx')`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  description: text("description"),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onUpdate: "cascade", onDelete: "restrict" }),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onUpdate: "cascade", onDelete: "restrict" }),
  note: text("note"),
  isConfirmed: boolean("is_confirmed").notNull().default(true),
  includeInTotal: boolean("include_in_total").notNull().default(true),
  recurrenceStartAt: timestamp("recurrence_start_at", { withTimezone: true }).notNull(),
  recurrenceEndAt: timestamp("recurrence_end_at", { withTimezone: true }),
  recurrenceRules: text("recurrence_rules").array(),
  recurrenceExdates: timestamp("recurrence_exdates", { withTimezone: true }).array(),
  recurrenceRdates: timestamp("recurrence_rdates", { withTimezone: true }).array(),
  lastOccurrenceAt: timestamp("last_occurrence_at", { withTimezone: true }),
  nextOccurrenceAt: timestamp("next_occurrence_at", { withTimezone: true }),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export const transactionModels = pgTable("transaction_models", {
  id: text("id").primaryKey().default(sql`new_id('txmd')`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
  amount: bigint("amount", { mode: "bigint" }),
  description: text("description"),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onUpdate: "cascade", onDelete: "restrict" }),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onUpdate: "cascade", onDelete: "restrict" }),
  note: text("note"),
  isConfirmed: boolean("is_confirmed").notNull().default(true),
  includeInTotal: boolean("include_in_total").notNull().default(true),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export const transferModels = pgTable(
  "transfer_models",
  {
    id: text("id").primaryKey().default(sql`new_id('tfmd')`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    description: text("description"),
    fromWalletId: text("from_wallet_id")
      .notNull()
      .references(() => wallets.id, { onUpdate: "cascade", onDelete: "restrict" }),
    toWalletId: text("to_wallet_id")
      .notNull()
      .references(() => wallets.id, { onUpdate: "cascade", onDelete: "restrict" }),
    fromAmount: bigint("from_amount", { mode: "bigint" }),
    toAmount: bigint("to_amount", { mode: "bigint" }),
    feeAmount: bigint("fee_amount", { mode: "bigint" }),
    note: text("note"),
    isConfirmed: boolean("is_confirmed").notNull().default(true),
    includeInTotal: boolean("include_in_total").notNull().default(true),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (table) => [check("transfer_models_wallets_distinct", sql`${table.fromWalletId} <> ${table.toWalletId}`)],
);

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().default(sql`new_id('tnsx')`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  description: text("description"),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onUpdate: "cascade", onDelete: "restrict" }),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onUpdate: "cascade", onDelete: "restrict" }),
  note: text("note"),
  isConfirmed: boolean("is_confirmed").notNull().default(true),
  includeInTotal: boolean("include_in_total").notNull().default(true),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdFromModelId: text("created_from_model_id").references(() => transactionModels.id, {
    onUpdate: "cascade",
    onDelete: "restrict",
  }),
});

export const transfers = pgTable(
  "transfers",
  {
    id: text("id").primaryKey().default(sql`new_id('tnsf')`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    description: text("description"),
    date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
    fromWalletId: text("from_wallet_id")
      .notNull()
      .references(() => wallets.id, { onUpdate: "cascade", onDelete: "restrict" }),
    toWalletId: text("to_wallet_id")
      .notNull()
      .references(() => wallets.id, { onUpdate: "cascade", onDelete: "restrict" }),
    fromAmount: bigint("from_amount", { mode: "bigint" }).notNull(),
    toAmount: bigint("to_amount", { mode: "bigint" }).notNull(),
    feeAmount: bigint("fee_amount", { mode: "bigint" }).notNull().default(sql`0`),
    note: text("note"),
    isConfirmed: boolean("is_confirmed").notNull().default(true),
    includeInTotal: boolean("include_in_total").notNull().default(true),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdFromModelId: text("created_from_model_id").references(() => transferModels.id, {
      onUpdate: "cascade",
      onDelete: "restrict",
    }),
  },
  (table) => [check("transfers_wallets_distinct", sql`${table.fromWalletId} <> ${table.toWalletId}`)],
);

export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  categories: many(categories),
  events: many(events),
}));

export const currenciesRelations = relations(currencies, ({ many }) => ({
  wallets: many(wallets),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  currency: one(currencies, {
    fields: [wallets.currencyId],
    references: [currencies.id],
  }),
  debts: many(debts),
  recurrentTransactions: many(recurrentTransactions),
  transactionModels: many(transactionModels),
  transactions: many(transactions),
  outgoingTransferModels: many(transferModels, { relationName: "fromTransferModelWallet" }),
  incomingTransferModels: many(transferModels, { relationName: "toTransferModelWallet" }),
  outgoingTransfers: many(transfers, { relationName: "fromTransferWallet" }),
  incomingTransfers: many(transfers, { relationName: "toTransferWallet" }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
  recurrentTransactions: many(recurrentTransactions),
  transactionModels: many(transactionModels),
  transactions: many(transactions),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
}));

export const debtsRelations = relations(debts, ({ one }) => ({
  wallet: one(wallets, {
    fields: [debts.walletId],
    references: [wallets.id],
  }),
}));

export const recurrentTransactionsRelations = relations(recurrentTransactions, ({ one }) => ({
  category: one(categories, {
    fields: [recurrentTransactions.categoryId],
    references: [categories.id],
  }),
  wallet: one(wallets, {
    fields: [recurrentTransactions.walletId],
    references: [wallets.id],
  }),
}));

export const transactionModelsRelations = relations(transactionModels, ({ one, many }) => ({
  category: one(categories, {
    fields: [transactionModels.categoryId],
    references: [categories.id],
  }),
  wallet: one(wallets, {
    fields: [transactionModels.walletId],
    references: [wallets.id],
  }),
  transactions: many(transactions),
}));

export const transferModelsRelations = relations(transferModels, ({ one, many }) => ({
  fromWallet: one(wallets, {
    fields: [transferModels.fromWalletId],
    references: [wallets.id],
    relationName: "fromTransferModelWallet",
  }),
  toWallet: one(wallets, {
    fields: [transferModels.toWalletId],
    references: [wallets.id],
    relationName: "toTransferModelWallet",
  }),
  transfers: many(transfers),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  model: one(transactionModels, {
    fields: [transactions.createdFromModelId],
    references: [transactionModels.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  fromWallet: one(wallets, {
    fields: [transfers.fromWalletId],
    references: [wallets.id],
    relationName: "fromTransferWallet",
  }),
  toWallet: one(wallets, {
    fields: [transfers.toWalletId],
    references: [wallets.id],
    relationName: "toTransferWallet",
  }),
  model: one(transferModels, {
    fields: [transfers.createdFromModelId],
    references: [transferModels.id],
  }),
}));

export type CategoryType = (typeof categoryTypeEnum.enumValues)[number];
export type CategoryTag = (typeof categoryTagEnum.enumValues)[number];
