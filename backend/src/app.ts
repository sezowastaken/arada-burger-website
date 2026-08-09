import Fastify from "fastify";
import { healthRoutes } from "./routes/health.js";
import { menuRoutes } from "./routes/menu.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(healthRoutes);
  app.register(menuRoutes, { prefix: "/api" });

  return app;
}
