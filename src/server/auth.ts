import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { trackReferralOnSignup } from "./referrals";

export const {
	handlers: { GET, POST },
	signIn,
	signOut,
	auth,
} = NextAuth({
	adapter: DrizzleAdapter(db),
	session: { strategy: "jwt" },
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			authorization: {
				params: {
					prompt: "select_account"
				}
			}
		}),
		Credentials({
			async authorize(credentials) {
				if (!credentials?.email || typeof credentials.email !== 'string') {
					console.error("Credentials authorize: Missing or invalid email.");
					return null;
				}

				const email = credentials.email;

				try {
					let user = await db.query.users.findFirst({
						where: eq(users.email, email),
					});

					if (user) {
						console.log(`Credentials authorize: Found user ${email}`);
						if (!user.emailVerified) {
							await db.update(users)
								.set({ emailVerified: new Date() })
								.where(eq(users.id, user.id));
							user.emailVerified = new Date();
						}
						return user;
					} else {
						console.log(`Credentials authorize: Creating new user ${email}`);
						const newUserResult = await db.insert(users).values({
							email: email,
							emailVerified: new Date(),
							name: email.split('@')[0],
						}).returning();

						if (!newUserResult || newUserResult.length === 0) {
							console.error("Credentials authorize: Failed to create user in DB.");
							return null;
						}
						user = newUserResult[0];

						if (user.id) {
							console.log('Credentials authorize: Tracking referral for new user:', user.id);
							await trackReferralOnSignup(user.id);
						}
						return user;
					}
				} catch (error) {
					console.error("Credentials authorize: Error during DB operation:", error);
					return null;
				}
			}
		})
	],
	events: {
		createUser: async ({ user }) => {
			if (user.id) {
				console.log('Tracking referral on signup for user (event - likely Google):', user.id);
				await trackReferralOnSignup(user.id);
			}
		}
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (token?.id && session.user) {
				(session.user as any).id = token.id;
			}
			return session;
		},
	}
});