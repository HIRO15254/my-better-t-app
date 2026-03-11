import { env } from "@my-better-t-app/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
} from "./schema/auth";
import { todo } from "./schema/todo";

export const db = drizzle(env.DATABASE_URL, {
	schema: {
		account,
		accountRelations,
		session,
		sessionRelations,
		todo,
		user,
		userRelations,
		verification,
	},
});
