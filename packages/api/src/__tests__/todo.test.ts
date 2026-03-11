import { describe, expect, it, vi } from "vitest";

vi.mock("@my-better-t-app/db", () => ({
	db: {},
}));

vi.mock("@my-better-t-app/env/server", () => ({
	env: {
		DATABASE_URL: "postgresql://test:test@localhost:5432/test",
		BETTER_AUTH_SECRET: "a".repeat(32),
		BETTER_AUTH_URL: "http://localhost:3000",
		CORS_ORIGIN: "http://localhost:3001",
		NODE_ENV: "test",
	},
}));

const { todoRouter } = await import("../routers/todo");

describe("todoRouter", () => {
	it("has getAll procedure", () => {
		expect(todoRouter).toHaveProperty("getAll");
	});

	it("has create procedure", () => {
		expect(todoRouter).toHaveProperty("create");
	});

	it("has toggle procedure", () => {
		expect(todoRouter).toHaveProperty("toggle");
	});

	it("has delete procedure", () => {
		expect(todoRouter).toHaveProperty("delete");
	});
});
