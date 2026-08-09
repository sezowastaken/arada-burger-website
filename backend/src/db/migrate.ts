import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client.js";

// Applies the same migration files/journal as `drizzle-kit migrate` (host-side
// db:migrate script) via drizzle-orm's runtime migrator, so it's safe to run
// both against the same database — already-applied migrations are skipped.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

migrate(db, { migrationsFolder })
  .then(() => {
    console.log("Migrations applied successfully.");
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
