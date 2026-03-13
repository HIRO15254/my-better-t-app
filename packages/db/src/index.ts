import { env } from "@my-better-t-app/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { schema } from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });
