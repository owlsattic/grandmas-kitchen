// /functions/api/admin/whoami.js
// Reports the current authenticated user.
// - First tries Cloudflare Access (CF-Access cookie/headers)
// - Falls back to Basic Auth (WORKSHOP_USER / WORKSHOP_PASS)
// - Returns 401 if neither is present

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extra,
    },
  });
}

function parseBasicAuth(req) {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith("Basic ")) return null;
  try {
    const [user, pass] = atob(h.slice(6)).split(":");
    return { user, pass };
  } catch {
    return null;
  }
}

function headerCI(req, name) {
  // case-insensitive header accessor
  for (const [k, v] of req.headers) {
    if (k.toLowerCase() === name.toLowerCase()) return v;
  }
  return null;
}

export const onRequestGet = async ({ request, env }) => {
  // ---- Option A: Cloudflare Access (best)
  // When the route is protected by Access, Cloudflare adds these headers:
  //   CF-Access-Authenticated-User-Email
  //   CF-Access-Authenticated-User-Id
  // We can rely on them instead of manually verifying the JWT.
  const accessEmail = headerCI(request, "CF-Access-Authenticated-User-Email");
  const accessSub   = headerCI(request, "CF-Access-Authenticated-User-Id");
  if (accessEmail) {
    return json({
      ok: true,
      auth: "access",
      user: accessEmail,
      sub: accessSub || null,
    });
  }

  // ---- Option B: Basic Auth (fallback)
  const basic = parseBasicAuth(request);
  const u = env.WORKSHOP_USER || "";
  const p = env.WORKSHOP_PASS || "";
  if (basic && basic.user === u && basic.pass === p && u) {
    return json({
      ok: true,
      auth: "basic",
      user: basic.user,
    });
  }

  // ---- No auth
  return json({ error: "not authenticated" }, 401);
};

// OPTIONAL: CORS preflight handler (only needed if you call from a different origin)
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
    },
  });
};
// JavaScript Document