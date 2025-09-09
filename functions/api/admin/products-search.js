// GET /api/admin/products-search?state=active|archived|all&q=<term>&limit=100
export const onRequestGet = async ({ request, env }) => {
  try {
    const url   = new URL(request.url);
    const state = (url.searchParams.get('state') || 'all').toLowerCase();
    const q     = (url.searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);

    const sb = new URL(`${env.SUPABASE_URL}/rest/v1/products`);
    sb.searchParams.set('select', [
      'product_num',
      'my_title',
      'amazon_title',
      'image_main',
      'amazon_category',
      'archived_at',
      'created_at'
    ].join(','));

    if (state === 'active')   sb.searchParams.set('archived_at', 'is.null');
    if (state === 'archived') sb.searchParams.set('archived_at', 'not.is.null');

    if (q) {
      const term = `*${q}*`;
      sb.searchParams.set('or', `(my_title.ilike.${term},amazon_title.ilike.${term},amazon_category.ilike.${term},product_num.ilike.${term})`);
    }

    sb.searchParams.set('order', 'created_at.desc');  // <— no updated_at
    sb.searchParams.set('limit', String(limit));

    const r = await fetch(sb.toString(), {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'count=exact',
      },
    });

    const rows = await r.json();
    if (!r.ok) return json({ error: rows?.message || `Supabase error ${r.status}`, details: rows }, 500, request);

    return json({ items: Array.isArray(rows) ? rows : [], version: 'products-search:v1' }, 200, request);
  } catch (e) {
    return json({ error: e?.message || 'Server error' }, 500, request);
  }
};

function json(obj, status = 200, request) {
  const origin = request?.headers?.get?.('Origin') || '*';
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'no-store',
      'X-Route-Version': 'products-search:v1',
    },
  });
}
