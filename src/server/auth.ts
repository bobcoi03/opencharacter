import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { trackReferralOnSignup } from "./referrals";

export const {
	handlers: { GET, POST },
	signIn,
	signOut,
	auth,
} = NextAuth({
	trustHost: true,
	adapter: DrizzleAdapter(db),
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			authorization: {
				params: {
					prompt: "select_account"
				}
			}
		})
	],
	events: {
		createUser: async ({ user }) => {
			// When a new user is created, check for referral cookies and record them
			if (user.id) {
				console.log('Tracking referral on signup for user:', user.id);
				await trackReferralOnSignup(user.id);
			}
		}
	}
});