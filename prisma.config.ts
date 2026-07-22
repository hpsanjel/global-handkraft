import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

// Prisma CLI does not automatically read .env.local in this setup.
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local") });

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: process.env["DATABASE_URL"],
	},
});
