import { NextResponse, type NextRequest } from "next/server";

// Server-side only: inside Docker this must reach the backend by its
// service name, not through the browser-facing NEXT_PUBLIC_API_URL — same
// distinction lib/api.ts's fetchMenu() makes for its own server-side fetch.
const SERVER_API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * The URL a payment provider redirects the customer's browser back to after
 * paying (see docs/product/roadmap.md M5). For iyzico's Checkout Form this
 * arrives as a form POST carrying only a `token`; for the dev-only
 * ManualProvider it's a plain GET. Either way this route's only job is to
 * ask the backend to verify and confirm the payment (the one place that
 * transition happens — see routes/checkout.ts's confirmPayment), then send
 * the browser on to the real, GET-able confirmation page. It renders
 * nothing itself.
 */
/**
 * Not `request.url`: inside the standalone Docker build, the Next.js
 * server resolves that against the container's own hostname rather than
 * the Host header the browser actually sent, so a redirect built from it
 * sends the customer's browser to an address only reachable from inside
 * the Docker network. Reconstructed from the request headers instead — the
 * same thing a reverse proxy is expected to forward correctly once one
 * exists (M8).
 */
function externalOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

async function confirmAndRedirect(request: NextRequest, lang: string, params: Record<string, string>) {
  const origin = externalOrigin(request);
  const token = params.token;
  if (!token) {
    return NextResponse.redirect(new URL(`/${lang}/cart`, origin));
  }

  try {
    await fetch(`${SERVER_API_URL}/api/payments/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      cache: "no-store",
    });
  } catch {
    // Confirmation failed to even reach the backend — the order page below
    // will just show whatever status the order was already at (most likely
    // still PENDING_PAYMENT), which is honest rather than silently wrong.
  }

  return NextResponse.redirect(new URL(`/${lang}/order/${token}`, origin));
}

export async function GET(request: NextRequest, context: { params: Promise<{ lang: string }> }) {
  const { lang } = await context.params;
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  return confirmAndRedirect(request, lang, query);
}

export async function POST(request: NextRequest, context: { params: Promise<{ lang: string }> }) {
  const { lang } = await context.params;
  const formData = await request.formData();
  const body: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") body[key] = value;
  }
  return confirmAndRedirect(request, lang, body);
}
