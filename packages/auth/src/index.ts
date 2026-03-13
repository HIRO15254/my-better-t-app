import {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
} from "@my-better-t-app/db/schema/auth";
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

export function createAuth(
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
