"use client";

import dynamic from "next/dynamic";

/**
 * https://agentation.com — a browser toolbar for annotating UI elements
 * during development; the annotation (element selector, source file, note)
 * is meant to be copied straight into a coding agent's prompt.
 *
 * `next/dynamic` behind a build-time NODE_ENV check, not a plain import +
 * runtime `if`: the dynamic import call itself sits inside a branch the
 * Next.js compiler statically eliminates in a production build, so the
 * package is never even fetched by a production client — not "imported but
 * inert," genuinely absent from that bundle.
 */
const Agentation =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("agentation").then((mod) => mod.Agentation), { ssr: false })
    : null;

export function DevAgentation() {
  if (!Agentation) return null;
  return <Agentation appName="Arada Burger Admin" />;
}
