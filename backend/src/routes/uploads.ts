import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import {
  ACCEPTED_MIME_TYPES,
  buildStoredFilename,
  detectImageKind,
} from "../uploads/imageFile.js";

/** 5 MB — comfortably above a phone photo, far below a denial-of-service. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Public path prefix the stored images are served under. */
export const UPLOAD_URL_PREFIX = "/uploads";

/**
 * Product image upload.
 *
 * Files live on the backend's own disk (a Docker volume in Compose) rather
 * than in the frontend's `public/` directory: the two are separate
 * deployments, and an upload must not require a frontend rebuild to show up.
 * The frontend rewrites `/uploads/*` to this service, so stored paths stay
 * origin-relative and `next/image` keeps treating them as local assets.
 */
export async function uploadRoutes(app: FastifyInstance) {
  app.post("/uploads", async (request, reply) => {
    const file = await request.file({ limits: { fileSize: MAX_IMAGE_BYTES } });

    if (!file) {
      return reply.status(400).send({ error: "Expected a multipart file field" });
    }

    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch (error) {
      // The plugin throws rather than handing back a truncated buffer. Caught
      // here only to replace "request file too large" with a message that says
      // what the limit actually is.
      if ((error as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.status(413).send({
          error: `Image is larger than ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB`,
        });
      }
      throw error;
    }

    const kind = detectImageKind(buffer);
    if (!kind) {
      return reply.status(415).send({
        error: `Unsupported image format. Accepted: ${ACCEPTED_MIME_TYPES.join(", ")}`,
      });
    }

    const filename = buildStoredFilename(file.filename ?? "image", kind);
    await mkdir(env.uploadDir, { recursive: true });
    await writeFile(path.join(env.uploadDir, filename), buffer);

    request.log.info({ filename, bytes: buffer.length, kind }, "stored product image");

    return reply.status(201).send({
      path: `${UPLOAD_URL_PREFIX}/${filename}`,
      bytes: buffer.length,
    });
  });
}
