import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Loaded relative to this file (not process.cwd()) so the backend picks up
// the repo-root .env the same way whether it's run via `npm run dev` from
// backend/, `db:migrate`/`db:seed`, or the built dist/ output. dotenv never
// overrides variables already set in the environment (e.g. by Docker
// Compose's `environment:` block), so this is a no-op inside containers.
config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: requireEnv("DATABASE_URL"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
};
