/* ---- functions/api/shop-list.js ---- */
/*
  Public list used by /shop.html

  GET /api/shop-list?limit=100
      &cat=<slug | id | name | amazon_category>
      &q=<search>

  Response:
  {
    items: [ { product_num, my_title, amazon_title, image_main, amazon_category,
               shop_category_id, approved, created_at } ],
    count: <number>,
    cats:  [ { id, name, slug } ]   // for the filter dropdown
  }
*/

export const onRequestGet = async ({ request, env }) => {
  try {
    const url   = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 200);
    const catIn = (url.searchParams.get("cat") || "").trim();
    const q     = (url.searchParams.get("q")   || "").trim();

    // --- Build products query ---
    const prodURL = new URL(`${env.SUPABASE_URL}/rest/v1/products`);
    prodURL.searchParams.set(
      "select",
      [
        "product_num",
        "my_title",
        "amazon_title",
        "my_description_short",
        "image_main",
        "affiliate_link",
        "amazon_category",
        "shop_category_id",
        "approved",
        "created_at",
      ].join(",")
    );

    // Only show “live” items
    prodURL.searchParams.set("approved", "eq.true");
    prodURL.searchParams.set("archived_at", "is.null");

    // Search across titles
    if (q) {
      // PostgREST OR syntax must be URL-encoded, let URL object do it
      prodURL.searchParams.set("or", `(my_title.ilike.*${q}*,amazon_title.ilike.*${q}*)`);
    }

    // Resolve category filter (slug | id | name) → shop_category_id,
    // otherwise fall back to legacy amazon_category match.
    if (catIn) {
      const numericId = Number(catIn);
      let catId = Number.isInteger(numericId) && String(numericId) === catIn ? numericId : null;

      if (!catId) {
        // Try by slug OR name
        const catURL = new URL(`${env.SUPABASE_URL}/rest/v1/categories`);
        catURL.searchParams.set("select", "id,slug,name");
        catURL.searchParams.set("or", `(slug.eq.${catIn},name.ilike.*${catIn}*)`);
        catURL.searchParams.set("limit", "1");

        const rCat = await fetch(catURL.toString(), {
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        });
        if (rCat.ok) {
          const rows = await rCat.json();
          if (Array.isArray(rows) && rows[0]?.id != null) {
            catId = rows[0].id;
          }
        }
      }

      if (catId != null) {
        prodURL.searchParams.set("shop_category_id", `eq.${catId}`);
      } else {
        // Back-compat: allow amazon_category exact match
        prodURL.searchParams.set("amazon_category", `eq.${catIn}`);
      }
    }

    // Sort newest first and limit
    prodURL.searchParams.set("order", "created_at.desc");
    prodURL.searchParams.set("limit", String(limit));

    const prodResp = await fetch(prodURL.toString(), {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const prodRows = await prodResp.json();
    if (!prodResp.ok) {
      return json(
        { error: prodRows?.message || `Supabase error ${prodResp.status}`, details: prodRows },
        500
      );
    }
    const items = Array.isArray(prodRows) ? prodRows : [];

    // --- Fetch curated categories for the filter dropdown ---
    const catsURL = new URL(`${env.SUPABASE_URL}/rest/v1/categories`);
    catsURL.searchParams.set("select", "id,name,slug");
    catsURL.searchParams.set("order", "name.asc");

    const catsResp = await fetch(catsURL.toString(), {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const catsRows = catsResp.ok ? await catsResp.json() : [];
    const cats = Array.isArray(catsRows) ? catsRows : [];

    // Publicly cache lightly
    return json(
      { items, count: items.length, cats },
      200,
      { "Cache-Control": "public, max-age=60" }
    );
  } catch (err) {
    return json({ error: err?.message || "Server error" }, 500);
  }
};

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
