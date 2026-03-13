import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "./src/worker.ts",
	format: "esm",
	outDir: "./dist",
	clean: true,
	noExternal: [/@my-better-t-app\/.*/],
});
