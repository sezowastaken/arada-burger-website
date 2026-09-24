"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackDirectionsClick, trackPhoneClick, trackSocialClick } from "@/lib/analytics";

const TRACKERS = {
  directions: trackDirectionsClick,
  phone: trackPhoneClick,
  social: trackSocialClick,
} as const;

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  lang: "tr" | "en";
  kind: keyof typeof TRACKERS;
}

/**
 * A plain `<a>` that also reports the click as an analytics event.
 *
 * Exists because the pages that hold these links (directions, and later
 * phone/social CTAs) are Server Components — they cannot hold an `onClick`
 * themselves — while keeping the tiny client boundary generic instead of
 * writing a near-identical wrapper per link kind.
 */
export function TrackedLink({ lang, kind, onClick, ...anchorProps }: Props) {
  return (
    <a
      {...anchorProps}
      onClick={(event) => {
        TRACKERS[kind](window.location.pathname, lang);
        onClick?.(event);
      }}
    />
  );
}
