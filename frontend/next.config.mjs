/**
 * Uploaded product images are stored by the backend, not in `public/`, so the
 * frontend proxies them. Keeping them on this origin means the database stores
 * an origin-relative path (`/uploads/x.png`), `next/image` treats it as a local
 * asset — no `remotePatterns` per environment — and nothing breaks if the
 * backend later moves to another host.
 *
 * Rewrites are resolved when `next build` runs, so under Docker this value has
 * to arrive as a build arg, the same way NEXT_PUBLIC_API_URL does.
 */
const backendOrigin =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
      // Same-origin analytics ingest. Calling the backend directly
      // (http://localhost:4000/...) from the browser made the request look
      // like third-party cross-origin tracking to some tracking-protection
      // setups; proxied through this origin, it reads as an ordinary
      // same-site request instead. Combined with the deliberately boring path
      // name — see backend/src/routes/analytics.ts for why "/api/collect"
      // (tried first) still got blocked.
      {
        source: "/api/relay",
        destination: `${backendOrigin}/api/relay`,
      },
    ];
  },
};

export default nextConfig;
