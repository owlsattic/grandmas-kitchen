// /functions/api/diag.js
// Minimal environment + Supabase connectivity check (no secrets leaked)

export async function onRequestGet({ env }) {
  const ok = (k) => Boolean(env?.[k]);
  const out = {
    supabase_url: ok("SUPABASE_URL"),
    supabase_key: ok("SUPABASE_SERVICE_ROLE_KEY"),
    amazon_keys_present: !!(env?.AMZ_ACCESS_KEY || env?.RAPIDAPI_KEY || env?.AMZ_PARTNER_TAG),
    urlHost: "",
    status: null,
    body: null,
    runtime: "pages-functions",
  };

  try { out.urlHost = new URL(env.SUPABASE_URL || "").host; } catch {}

  if (!out.supabase_url || !out.supabase_key) {
    return json(out); // show which envs are missing
  }

  try {
    // Harmless probe to confirm the key actually works
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "count=exact",
      },
    });
    out.status = r.status;
    out.body = await r.text(); // keep raw for debugging
  } catch (e) {
    out.status = 0;
    out.body = e?.message || "fetch error";
  }

  return json(out);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
