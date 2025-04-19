import { integer, sqliteTable, text, primaryKey, index, real  } from "drizzle-orm/sqlite-core"
import type { AdapterAccountType } from "next-auth/adapters"
import { sql, relations } from "drizzle-orm";

export type PaymentRecord = {
  amount: number;
  date: number; // timestamp in ms
  status: 'pending' | 'paid' | 'failed';
  transaction_id?: string;
}

// This type is kept for reference
export type ReferredUser = {
  user_id: string;
  signup_date: number; // timestamp in ms
  pro_user: boolean;
  earnings: number;
  pro_since: number; // timestamp in ms
  attribution_expires: number; // timestamp when 30-day window expires
  referral_status: 'pending' | 'active' | 'expired';
  payment_history: PaymentRecord[];
}

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  bio: text("bio"),
  pay_as_you_go: integer("pay_as_you_go", { mode: "boolean" }).notNull().default(false),
  referral_link: text("referral_link"),
  paypal_email: text("paypal_email"),
})

// Table for tracking referrals with proper relationships
export const referrals = sqliteTable("referral", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  referrer_id: text("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referred_id: text("referred_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  signup_date: integer("signup_date", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  attribution_expires: integer("attribution_expires", { mode: "timestamp_ms" })
    .notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'active', 'expired'
  pro_conversion_date: integer("pro_conversion_date", { mode: "timestamp_ms" }),
  total_earnings: real("total_earnings").notNull().default(0),
  last_payment_date: integer("last_payment_date", { mode: "timestamp_ms" }),
  last_payment_amount: real("last_payment_amount"),
  last_payment_status: text("last_payment_status"),
  payment_history: text("payment_history", { mode: "json" }).notNull().default("[]").$type<PaymentRecord[]>(),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  referrerIdx: index('referral_referrer_idx').on(table.referrer_id),
  referredIdx: index('referral_referred_idx').on(table.referred_id),
  uniqueReferral: index('unique_referral_idx').on(table.referrer_id, table.referred_id),
}));

// Add relations for the referrals table
export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrer_id],
    references: [users.id],
  }),
  referred: one(users, {
    fields: [referrals.referred_id],
    references: [users.id],
  }),
}));

export const socialSubmissions = sqliteTable("social_submission", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  text: text("text").notNull(),
  message: text("message"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
});
 
export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)
 
export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})
 
export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)
 
export const authenticators = sqliteTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: integer("credentialBackedUp", {
      mode: "boolean",
    }).notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
)

export const characters = sqliteTable("character", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  greeting: text("greeting").notNull(),
  visibility: text("visibility").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  interactionCount: integer("interactionCount").notNull().default(0),
  likeCount: integer("likeCount").notNull().default(0),
  tags: text("tags").notNull().default("[]"),
  avatar_image_url: text("avatar_image_url"),
  banner_image_url: text("banner_image_url"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  temperature: real("temperature"),
  top_p: real("top_p"),
  top_k: integer("top_k"),
  frequency_penalty: real("frequency_penalty"),
  presence_penalty: real("presence_penalty"),
  repetition_penalty: real("repetition_penalty"),
  min_p: real("min_p"),
  top_a: real("top_a"),
  max_tokens: integer("max_tokens")
})

// Define the structure of the messages array
export type ChatMessage = {
  id: string;
  content: string | MultimodalContent[];
  role: 'user' | 'assistant' | 'system';
  time?: number;
  rating?: number;
  model?: string;
};

export type MultimodalContent = {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
};

export type ChatMessageArray = ChatMessage[];

export const chat_sessions = sqliteTable("chat_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  character_id: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  messages: text("messages", { mode: "json" }).notNull().$type<ChatMessageArray>(),  
  interaction_count: integer("interaction_count").notNull().default(0),
  last_message_timestamp: integer("last_message_timestamp", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  summary: text("summary"),
  share: integer("share", { mode: "boolean" }),
  title: text("title"),
}, (table) => ({
  userCharacterIndex: index('user_character_idx').on(table.user_id, table.character_id),
}));

export const rooms = sqliteTable("room", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  topic: text("topic"),
  visibility: text("visibility").notNull().default("public"),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  interactionCount: integer("interactionCount").notNull().default(0),
  likeCount: integer("likeCount").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
});

export const roomCharacters = sqliteTable("room_characters", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  roomId: text("roomId")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  characterId: text("characterId")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
});

export const group_chat_sessions = sqliteTable("group_chat_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  roomId: text("roomId")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  messages: text("messages").notNull().default('[]'),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
});

export const group_chat_session_characters = sqliteTable("group_chat_session_characters", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("sessionId")
    .notNull()
    .references(() => group_chat_sessions.id, { onDelete: "cascade" }),
  characterId: text("characterId")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
});

export const personas = sqliteTable("persona", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("displayName").notNull(),
  background: text("background").notNull(),
  isDefault: integer("isDefault", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  image: text("image")
});

export const subscriptions = sqliteTable("subscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripeCustomerId").notNull(),
  stripeSubscriptionId: text("stripeSubscriptionId").notNull(),
  stripePriceId: text("stripePriceId").notNull(),
  stripeCurrentPeriodStart: integer("stripeCurrentPeriodStart", { mode: "timestamp_ms" }).notNull(),
  stripeCurrentPeriodEnd: integer("stripeCurrentPeriodEnd", { mode: "timestamp_ms" }).notNull(),
  status: text("status").notNull(), // 'active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'
  planType: text("planType").notNull(), // 'pro', etc.
  cancelAtPeriodEnd: integer("cancelAtPeriodEnd", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('subscription_user_id_idx').on(table.userId),
  stripeCustomerIdIdx: index('subscription_stripe_customer_id_idx').on(table.stripeCustomerId),
  stripeSubscriptionIdIdx: index('subscription_stripe_subscription_id_idx').on(table.stripeSubscriptionId),
}));

export const stripe_customer_id = sqliteTable("stripe_customer_id", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripeCustomerId").notNull().unique()
})

export const twitter_roasts = sqliteTable("twitter_roast", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull(),
  roastContent: text("roastContent").notNull(),
  userId: text("userId")
    .references(() => users.id, { onDelete: "cascade" }),
  likeCount: integer("likeCount").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  usernameIdx: index('twitter_roast_username_idx').on(table.username),
  userIdIdx: index('twitter_roast_user_id_idx').on(table.userId),
}));

export const user_daily_requests = sqliteTable("user_daily_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  requestCount: integer("request_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const user_credits = sqliteTable("user_credits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: real("balance").notNull().default(0),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});