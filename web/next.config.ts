import type { NextConfig } from "next";
import path from "node:path";

// Static export for Cloudflare Pages. There is no Node server in production:
// path proxying to the Flask app and the contact endpoint are Pages Functions
// (see web/functions/), so rewrites() and headers() are not used here.
// Local dev still proxies, which keeps `npm run dev` a faithful preview.
const FLASK = process.env.AUCTION_API_URL ?? "http://127.0.0.1:5000";

const FLASK_PATHS = [
  "/auction/:path*",
  "/login",
  "/logout",
  "/register",
  "/admin/:path*",
  "/terms",
  "/privacy",
  "/opt-out",
  "/api/hit",
  "/api/lots",
  "/static/:path*",
];

const nextConfig: NextConfig = {
  output: "export",

  // The image optimizer needs a server. Cloudflare serves these as-is.
  images: { unoptimized: true },

  // The repo root also carries a package-lock.json (for the docx report script),
  // so Turbopack guesses the wrong workspace root. Pin it to this directory.
  turbopack: { root: path.resolve(process.cwd()) },

  // Dev only. A static export cannot carry rewrites, and declaring them
  // unconditionally just makes `next build` warn about it every time.
  ...(process.env.NODE_ENV === "development"
    ? {
        async rewrites() {
          return FLASK_PATHS.map((source) => ({ source, destination: `${FLASK}${source}` }));
        },
      }
    : {}),
};

export default nextConfig;
