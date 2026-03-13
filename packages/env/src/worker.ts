import { createEnv } from "@t3-oss/env-core";
import { serverEnvSchema } from "./schema";

export function createWorkerEnv(bindings: Record<string, string>) {
	return createEnv({
		server: serverEnvSchema,
		runtimeEnv: bindings,
		emptyStringAsUndefined: true,
	});
}
