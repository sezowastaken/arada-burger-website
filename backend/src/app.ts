import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { mkdirSync } from "node:fs";
import { env } from "./config/env.js";
import { adminAnalyticsRoutes } from "./routes/adminAnalytics.js";
import { adminInventoryRoutes } from "./routes/adminInventory.js";
import { adminOrdersRoutes } from "./routes/adminOrders.js";
import { adminRoutes } from "./routes/admin.js";
import { adminSettingsRoutes } from "./routes/adminSettings.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { checkoutRoutes } from "./routes/checkout.js";
import { healthRoutes } from "./routes/health.js";
import { menuRoutes } from "./routes/menu.js";
import { MAX_IMAGE_BYTES, UPLOAD_URL_PREFIX, uploadRoutes } from "./routes/uploads.js";

export function buildApp() {
  // removeAdditional defaults to true, which silently strips unknown body
  // properties; we'd rather reject them so typos in admin payloads surface
  // as a 400 instead of being quietly ignored.
  const app = Fastify({
    logger: true,
    ajv: { customOptions: { removeAdditional: false } },
  });

  // @fastify/cors defaults to GET,HEAD,POST only — the admin UI also needs
  // PATCH (edits) and DELETE (removing a recipe row), otherwise the browser
  // blocks them at the preflight.
  app.register(cors, {
    origin: env.corsOrigin,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
  });
  app.register(multipart, { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });

  // Created eagerly so a missing directory is a startup failure rather than a
  // confusing 404 on the first image someone uploads.
  mkdirSync(env.uploadDir, { recursive: true });
  app.register(fastifyStatic, {
    root: env.uploadDir,
    prefix: `${UPLOAD_URL_PREFIX}/`,
    index: false,
    // Filenames carry random bytes and are never reused, so a stored image is
    // immutable and can be cached hard.
    maxAge: "365d",
    immutable: true,
    // These bytes came from a user. The Content-Type is derived from the
    // extension, which we control, but nosniff stops a browser from deciding
    // for itself that a file we call an image is really a document.
    setHeaders(reply) {
      reply.header("X-Content-Type-Options", "nosniff");
    },
  });

  app.register(healthRoutes);
  app.register(menuRoutes, { prefix: "/api" });
  app.register(analyticsRoutes, { prefix: "/api/relay" });
  app.register(checkoutRoutes, { prefix: "/api" });
  app.register(adminRoutes, { prefix: "/api/admin" });
  app.register(uploadRoutes, { prefix: "/api/admin" });
  app.register(adminAnalyticsRoutes, { prefix: "/api/admin" });
  app.register(adminInventoryRoutes, { prefix: "/api/admin" });
  app.register(adminOrdersRoutes, { prefix: "/api/admin" });
  app.register(adminSettingsRoutes, { prefix: "/api/admin" });

  return app;
}
