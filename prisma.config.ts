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
		// CLI (db push / migrate / introspect) needs a direct, non-pooled
		// connection — pgbouncer transaction mode hangs on schema-engine DDL.
		// The app's runtime client uses the pooled DATABASE_URL separately
		// via the driver adapter in lib/prisma.ts.
		url: process.env["DIRECT_URL"],
	},
});
