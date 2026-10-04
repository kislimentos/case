import { pgTable, serial, text, integer, doublePrecision, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // simple password for this demo
  balance: doublePrecision("balance").notNull().default(0),
  avatar: text("avatar"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const skins = pgTable("skins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rarity: text("rarity").notNull(), // 'blue', 'purple', 'pink', 'red', 'gold'
  price: doublePrecision("price").notNull(),
  image: text("image").notNull(),
  collection: text("collection"),
});

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  image: text("image").notNull(),
  isLimited: boolean("is_limited").default(false),
  expiresAt: timestamp("expires_at"),
});

export const caseSkins = pgTable("case_skins", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => cases.id, { onDelete: 'cascade' }),
  skinId: integer("skin_id").references(() => skins.id, { onDelete: 'cascade' }),
  odds: doublePrecision("odds").notNull(), // Probability weight
});

export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").references(() => users.id, { onDelete: 'cascade' }),
  skinId: integer("skin_id").references(() => skins.id, { onDelete: 'cascade' }),
  isSold: boolean("is_sold").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  inventory: many(inventory),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  user: one(users, { fields: [inventory.userId], references: [users.id] }),
  skin: one(skins, { fields: [inventory.skinId], references: [skins.id] }),
}));

export const casesRelations = relations(cases, ({ many }) => ({
  skins: many(caseSkins),
}));

export const caseSkinsRelations = relations(caseSkins, ({ one }) => ({
  case: one(cases, { fields: [caseSkins.caseId], references: [cases.id] }),
  skin: one(skins, { fields: [caseSkins.skinId], references: [skins.id] }),
}));
