import { auth } from "@my-better-t-app/auth";
import { createContextFactory } from "./context-factory";

export const createContext = createContextFactory(auth);

export type Context = Awaited<ReturnType<typeof createContext>>;
