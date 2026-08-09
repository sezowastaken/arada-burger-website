import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { adminRoutes } from "./routes/admin.js";
import { healthRoutes } from "./routes/health.js";
import { menuRoutes } from "./routes/menu.js";

export function buildApp() {
  // removeAdditional defaults to true, which silently strips unknown body
  // properties; we'd rather reject them so typos in admin payloads surface
  // as a 400 instead of being quietly ignored.
  const app = Fastify({
    logger: true,
    ajv: { customOptions: { removeAdditional: false } },
  });

  // @fastify/cors defaults to GET,HEAD,POST only — the admin UI also needs
  // PATCH, otherwise the browser blocks it at the preflight.
  app.register(cors, {
    origin: env.corsOrigin,
    methods: ["GET", "HEAD", "POST", "PATCH"],
  });
  app.register(healthRoutes);
  app.register(menuRoutes, { prefix: "/api" });
  app.register(adminRoutes, { prefix: "/api/admin" });

  return app;
}
