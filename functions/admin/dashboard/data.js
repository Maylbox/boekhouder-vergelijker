export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  const days = clampInt(url.searchParams.get("days"), 1, 365, 30);
  const type = (url.searchParams.get("type") || "all").toLowerCase(); // all | site | info
  const cat  = (url.searchParams.get("cat") || "all").toLowerCase();  // all | homepage | article | comparison | directory | other

  const sinceTs = Date.now() - days * 24 * 60 * 60 * 1000;

  // optional filters
  const where = [`ts >= ?`];
  const bind = [sinceTs];

  if (type !== "all") {
    where.push(`type = ?`);
    bind.push(type);
  }
  if (cat !== "all") {
    where.push(`category = ?`);
    bind.push(cat);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  // KPI: total clicks, unique slugs, last ts
  const kpiRow = await env.bv_clicks.prepare(
    `
    SELECT
      COUNT(*) AS total_clicks,
      COUNT(DISTINCT slug) AS unique_slugs,
      MAX(ts) AS last_ts
    FROM clicks
    ${whereSql}
    `
  ).bind(...bind).first();

  // Clicks per day (store day as dd-mm without year)
  // We'll compute day label in SQL using unix epoch ms -> seconds.
  // NOTE: ts is ms; datetime() expects seconds.
  const daysRes = await env.bv_clicks.prepare(
    `
    SELECT
      strftime('%d-%m', datetime(ts/1000, 'unixepoch')) AS day,
      COUNT(*) AS clicks
    FROM clicks
    ${whereSql}
    GROUP BY day
    ORDER BY MIN(ts) DESC
    LIMIT 120
    `
  ).bind(...bind).all();

  // Clicks per slug
  const slugsRes = await env.bv_clicks.prepare(
    `
    SELECT slug, COUNT(*) AS clicks
    FROM clicks
    ${whereSql}
    GROUP BY slug
    ORDER BY clicks DESC
    LIMIT 50
    `
  ).bind(...bind).all();

  // Recent clicks
  const recentRes = await env.bv_clicks.prepare(
    `
    SELECT ts, slug, type, category, country
    FROM clicks
    ${whereSql}
    ORDER BY ts DESC
    LIMIT 200
    `
  ).bind(...bind).all();

  const body = JSON.stringify({
    kpis: {
      total_clicks: Number(kpiRow?.total_clicks || 0),
      unique_slugs: Number(kpiRow?.unique_slugs || 0),
      last_ts: kpiRow?.last_ts ? Number(kpiRow.last_ts) : null
    },
    days: (daysRes?.results || []).map(r => ({
      day: r.day,
      clicks: Number(r.clicks || 0)
    })),
    slugs: (slugsRes?.results || []).map(r => ({
      slug: r.slug,
      clicks: Number(r.clicks || 0)
    })),
    recent: (recentRes?.results || []).map(r => ({
      ts: Number(r.ts),
      slug: r.slug,
      type: r.type,
      category: r.category,
      country: r.country
    }))
  });

  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
