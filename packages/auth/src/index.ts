import { db } from "@my-better-t-app/db";
import {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
} from "@my-better-t-app/db/schema/auth";
import { env } from "@my-better-t-app/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const authSchema = {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
};

interface AuthOptions {
	baseURL?: string;
	corsOrigin: string;
	secret: string;
}

export function createAuthInstance(
	dbInstance: Parameters<typeof drizzleAdapter>[0],
	options: AuthOptions
) {
	return betterAuth({
		secret: options.secret,
		baseURL: options.baseURL,
		database: drizzleAdapter(dbInstance, {
			provider: "pg",
			schema: authSchema,
		}),
		trustedOrigins: [options.corsOrigin],
		emailAndPassword: {
			enabled: true,
		},
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		plugins: [],
	});
}

export const auth = createAuthInstance(db, {
	corsOrigin: env.CORS_ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
});
