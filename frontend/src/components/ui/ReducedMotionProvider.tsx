"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Makes every Framer Motion animation on the site obey the operating system's
 * "reduce motion" setting.
 *
 * CSS animations are covered by a media query in globals.css, but Framer
 * Motion drives transforms from JavaScript, so the accordion's shared-layout
 * animations ignored the setting entirely. `reducedMotion="user"` keeps
 * opacity and colour changes — which carry meaning — while dropping the
 * transform and layout animation that causes the problem.
 *
 * Children are passed through untouched, so server components stay server
 * components.
 */
export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
