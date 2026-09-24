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
  // Where uploaded product images are written. Resolved against the backend
  // package root so it lands in backend/uploads whether this runs from src/
  // (tsx) or dist/ (container). In Docker this path is a named volume, so
  // images survive image rebuilds.
  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads"),

  // The origin the frontend is actually served from — used to build the
  // callback/redirect URL a payment provider sends the customer's browser
  // back to. Not the same as corsOrigin's purpose, even though it's usually
  // the same value: this one is embedded in outgoing requests, not checked
  // against incoming ones.
  publicSiteUrl: process.env.PUBLIC_SITE_URL ?? "http://localhost:3000",

  // How the *browser* reaches this backend — reuses the frontend's own
  // NEXT_PUBLIC_API_URL (same value, both containers load the same root
  // .env) rather than inventing a second variable for it. Needed by
  // ManualProvider, whose "checkout URL" is handed straight to the
  // customer's browser — unlike a normal server-to-server call, the
  // Docker-internal `http://backend:4000` would be unreachable from there.
  publicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",

  // "manual" is the only provider that actually works before a real one is
  // under contract — see backend/src/payments. Never defaults to a real
  // provider: an unset PAYMENT_PROVIDER must never accidentally try to reach
  // a live gateway with empty credentials.
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "manual",
  iyzico: {
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    // Sandbox by default so a misconfigured deploy fails safely (against a
    // test environment) rather than silently reaching production.
    uri: process.env.IYZICO_URI ?? "https://sandbox-api.iyzipay.com",
  },
};
