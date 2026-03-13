import { auth, type createAuthInstance } from "@my-better-t-app/auth";
import type { Context as HonoContext } from "hono";

export interface CreateContextOptions {
	context: HonoContext;
}

type AuthInstance = ReturnType<typeof createAuthInstance>;

export function createContextFactory(authInstance: AuthInstance) {
	return async ({ context }: CreateContextOptions) => {
		const session = await authInstance.api.getSession({
			headers: context.req.raw.headers,
		});
		return { session };
	};
}

export const createContext = createContextFactory(auth);

export type Context = Awaited<ReturnType<typeof createContext>>;
