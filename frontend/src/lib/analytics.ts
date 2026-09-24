"use client";

/**
 * First-party site analytics client.
 *
 * Privacy-by-design, matching `backend/src/db/schema.ts`: the session token
 * lives in `sessionStorage`, not a cookie, so it is gone the moment the tab
 * closes and cannot be used to profile a visitor across days. No IP address
 * or User-Agent string is ever sent — only a device-type bucket computed here
 * from the viewport. A failure here must never affect the page: every call is
 * fire-and-forget and swallows its own errors.
 */

type EventType =
  | "page_view"
  | "menu_view"
  | "product_click"
  | "category_click"
  | "phone_click"
  | "directions_click"
  | "social_click";

type Lang = "tr" | "en";

const SESSION_KEY = "arada-analytics-session";
const FIRST_TOUCH_KEY = "arada-analytics-first-touch";

function getSessionToken(): string | null {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const token = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, token);
    return token;
  } catch {
    // Private-mode Safari and similar throw on sessionStorage access rather
    // than just no-opping it. Analytics is not essential, so give up quietly.
    return null;
  }
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

interface FirstTouch {
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Computed once per session and cached, so a visitor browsing several pages
 * keeps reporting how they *originally* arrived rather than "themselves" once
 * `document.referrer` becomes our own previous page.
 */
function getFirstTouch(): FirstTouch {
  try {
    const cached = window.sessionStorage.getItem(FIRST_TOUCH_KEY);
    if (cached) return JSON.parse(cached) as FirstTouch;

    const touch: FirstTouch = {};

    if (document.referrer) {
      try {
        const referrerHost = new URL(document.referrer).hostname;
        if (referrerHost && referrerHost !== window.location.hostname) {
          touch.referrerHost = referrerHost;
        }
      } catch {
        // Malformed or opaque referrer — leave it unset.
      }
    }

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    if (utmSource) touch.utmSource = utmSource;
    if (utmMedium) touch.utmMedium = utmMedium;
    if (utmCampaign) touch.utmCampaign = utmCampaign;

    window.sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch));
    return touch;
  } catch {
    return {};
  }
}

function track(
  type: EventType,
  path: string,
  lang: Lang,
  extra?: { productSlug?: string; categorySlug?: string },
) {
  if (typeof window === "undefined") return;

  const sessionToken = getSessionToken();
  if (!sessionToken) return;

  const body = JSON.stringify({
    sessionToken,
    device: getDeviceType(),
    lang,
    ...getFirstTouch(),
    events: [{ type, path, lang, ...extra }],
  });

  // Relative, same-origin, and named nothing like "analytics" — see
  // next.config.mjs and backend/src/routes/analytics.ts for why both of those
  // turned out to matter, not just one.
  //
  // keepalive lets the request survive a navigation that starts right after
  // the click that triggered it (e.g. the directions link opening a new tab).
  fetch("/api/relay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Never let a network hiccup surface to the visitor.
  });
}

export function trackPageView(path: string, lang: Lang) {
  track("page_view", path, lang);
}

export function trackMenuView(path: string, lang: Lang) {
  track("menu_view", path, lang);
}

export function trackProductClick(path: string, lang: Lang, productSlug: string) {
  track("product_click", path, lang, { productSlug });
}

export function trackCategoryClick(path: string, lang: Lang, categorySlug: string) {
  track("category_click", path, lang, { categorySlug });
}

export function trackDirectionsClick(path: string, lang: Lang) {
  track("directions_click", path, lang);
}

export function trackPhoneClick(path: string, lang: Lang) {
  track("phone_click", path, lang);
}

export function trackSocialClick(path: string, lang: Lang) {
  track("social_click", path, lang);
}
