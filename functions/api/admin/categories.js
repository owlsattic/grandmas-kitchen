// /functions/api/admin/categories.js
// GET  /api/admin/categories        -> { items:[{id,name,slug}, ...] }
// POST /api/admin/categories {name} -> { ok:true, category:{...}, existed?:true }
// OPTIONS supported for CORS

export const onRequestOptions = ({ request }) =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Cf-Access-Jwt-Assertion, Cf-Access-Authenticated-User-Email",
      "Access-Control-Allow-Credentials": "true",
      "Vary": "Origin",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });

export const onRequestGet = async ({ env, request }) => {
  try {
    const u = new URL(`${env.SUPABASE_URL}/rest/v1/categories`);
    u.searchParams.set("select", "id,name,slug");
    u.searchParams.set("order", "name.asc");

    const r = await fetch(u.toString(), {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!r.ok) return json({ error: "Supabase list failed" }, 500, request);
    const rows = await r.json();
    return json({ items: rows || [] }, 200, request);
  } catch (e) {
    return json({ error: e?.message || "Server error" }, 500, request);
  }
};

// Safe select-then-insert (works even if ON CONFLICT is unavailable)
export const onRequestPost = async ({ request, env }) => {
  try {
    const { name } = await request.json();
    const clean = String(name || "").trim();
    if (!clean) return json({ error: "name is required" }, 400, request);

    const slug = slugify(clean);

    // 1) Look up existing by slug
    const existing = await fetchBySlug(env, slug);
    if (existing) return json({ ok: true, category: existing, existed: true }, 200, request);

    // 2) Insert (no on_conflict)
    const uIns = new URL(`${env.SUPABASE_URL}/rest/v1/categories`);
    const rIns = await fetch(uIns.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify([{ name: clean, slug }]),
    });

    const outIns = await rIns.json();
    if (!rIns.ok) {
      return json({ error: outIns?.message || "Create failed", details: outIns }, 400, request);
    }
    const cat = Array.isArray(outIns) ? outIns[0] : outIns;
    return json({ ok: true, category: cat }, 201, request);
  } catch (e) {
    return json({ error: e?.message || "Server error" }, 500, request);
  }
};

// ----- helpers -----
async function fetchBySlug(env, slug) {
  const u2 = new URL(`${env.SUPABASE_URL}/rest/v1/categories`);
  u2.searchParams.set("select", "id,name,slug");
  u2.searchParams.set("slug", `eq.${slug}`);
  u2.searchParams.set("limit", "1");
  const r2 = await fetch(u2.toString(), {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!r2.ok) return null;
  const rows2 = await r2.json();
  return (Array.isArray(rows2) && rows2[0]) || null;
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function json(obj, status = 200, request) {
  const origin = request?.headers?.get?.("Origin") || "*";
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Vary": "Origin",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
