import { db } from "@my-better-t-app/db";
import { env } from "@my-better-t-app/env/server";
import { createAuthInstance } from "./factory";

export const auth = createAuthInstance(db, {
	corsOrigin: env.CORS_ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
});
