import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const premiumCodes = pgTable("premium_codes", {
  code: text("code").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PremiumCode = typeof premiumCodes.$inferSelect;
