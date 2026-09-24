import { randomBytes } from "node:crypto";

/**
 * Accepted product image formats.
 *
 * The browser's declared Content-Type is attacker-controlled and, from a
 * phone, often wrong even without an attacker (`application/octet-stream` is
 * common). The file's own leading bytes are the only thing worth trusting, so
 * the extension we store is derived from them, never from the upload.
 */
export type ImageKind = "png" | "jpeg" | "webp";

const EXTENSION: Record<ImageKind, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
};

export const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function detectImageKind(buffer: Buffer): ImageKind | null {
  if (buffer.length < 12) return null;

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

const TURKISH_CHARS: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

/**
 * Builds the stored filename: a readable slug of what was uploaded plus random
 * bytes. The slug is for whoever has to look in the directory later; the random
 * suffix is what makes the name safe and unique, so a hostile original name can
 * only ever shorten the readable half to nothing.
 */
export function buildStoredFilename(originalName: string, kind: ImageKind): string {
  const base = originalName
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[çğıöşü]/g, (char) => TURKISH_CHARS[char] ?? char)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const suffix = randomBytes(6).toString("hex");
  return `${base ? `${base}-` : ""}${suffix}.${EXTENSION[kind]}`;
}
