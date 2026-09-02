/**
 * Cloudflare Pages middleware.
 *
 * The marketing pages are static files on Cloudflare's CDN. Bidding, auth,
 * admin, and the legal pages stay in the Flask app on Render. This proxies
 * those paths so both halves share one origin, which keeps the login cookie
 * working across the whole site.
 *
 * FLASK_ORIGIN is set in the Pages project settings, e.g.
 *   https://auctiongera.onrender.com
 */
interface Env {
  FLASK_ORIGIN: string;
}

// Matched against the start of the pathname.
const PROXY_PREFIXES = [
  "/auction",
  "/login",
  "/logout",
  "/register",
  "/admin",
  "/terms",
  "/privacy",
  "/opt-out",
  "/static/",
  "/api/hit",
  "/api/lots",
];

const shouldProxy = (pathname: string) =>
  PROXY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  // /api/contact is handled by this project's own function, not Flask.
  if (url.pathname === "/api/contact" || !shouldProxy(url.pathname)) {
    return context.next();
  }

  const origin = context.env.FLASK_ORIGIN;
  if (!origin) {
    return new Response("FLASK_ORIGIN is not configured", { status: 500 });
  }

  const target = new URL(url.pathname + url.search, origin);

  // Host is deliberately not forwarded: Render routes by its own hostname, and
  // Flask builds relative URLs, so it does not need the public host.
  const headers = new Headers(context.request.headers);
  headers.delete("host");
  headers.set("X-Forwarded-Host", url.host);
  headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

  const response = await fetch(target, {
    method: context.request.method,
    headers,
    body: ["GET", "HEAD"].includes(context.request.method) ? undefined : context.request.body,
    redirect: "manual", // Let the browser follow Flask's redirects on our domain.
  });

  // Response is rebuilt so Set-Cookie survives and stays mutable.
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};
