export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  const range = (url.searchParams.get("range") || "days").toLowerCase();
  const days  = clampInt(url.searchParams.get("days"), 1, 365, 30);
  const hours = clampInt(url.searchParams.get("hours"), 1, 168, 24);

  const type = (url.searchParams.get("type") || "all").toLowerCase(); // all | site | info
  const cat  = (url.searchParams.get("cat") || "all").toLowerCase();  // all | homepage | article | comparison | directory | other

  // ---- time window
  const now = Date.now();
  let sinceTs = null;
  let untilTs = null;

  if (range === "all") {
    // no time filter
  } else if (range === "hours") {
    sinceTs = now - hours * 60 * 60 * 1000;
  } else if (range === "custom") {
    // Expect YYYY-MM-DD (local). We'll interpret as local-midnight to local-23:59:59
    const from = String(url.searchParams.get("from") || "").trim();
    const to   = String(url.searchParams.get("to") || "").trim();
    const fromMs = parseDateLocalStart(from);
    const toMs   = parseDateLocalEnd(to);
    if (fromMs != null) sinceTs = fromMs;
    if (toMs != null) untilTs = toMs;
  } else {
    // default days
    sinceTs = now - days * 24 * 60 * 60 * 1000;
  }

  // ---- optional filters
  const where = [];
  const bind = [];

  if (sinceTs != null) { where.push(`ts >= ?`); bind.push(sinceTs); }
  if (untilTs != null) { where.push(`ts <= ?`); bind.push(untilTs); }

  if (type !== "all") { where.push(`type = ?`); bind.push(type); }
  if (cat !== "all")  { where.push(`category = ?`); bind.push(cat); }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // KPI
  const kpiRow = await env.DB.prepare(
    `
    SELECT
      COUNT(*) AS total_clicks,
      COUNT(DISTINCT slug) AS unique_slugs,
      MAX(ts) AS last_ts
    FROM clicks
    ${whereSql}
    `
  ).bind(...bind).first();

  // clicks per day (table)
  const daysRes = await env.DB.prepare(
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

  // clicks per slug
  const slugsRes = await env.DB.prepare(
    `
    SELECT slug, COUNT(*) AS clicks
    FROM clicks
    ${whereSql}
    GROUP BY slug
    ORDER BY clicks DESC
    LIMIT 50
    `
  ).bind(...bind).all();

  // recent clicks
  const recentRes = await env.DB.prepare(
    `
    SELECT ts, slug, type, category, country
    FROM clicks
    ${whereSql}
    ORDER BY ts DESC
    LIMIT 200
    `
  ).bind(...bind).all();

  // ---- chart series
  // If range is hours/custom that spans ~<= 48h => bucket by hour, else bucket by day
  const useHours =
    range === "hours" ||
    (range === "custom" && sinceTs != null && untilTs != null && (untilTs - sinceTs) <= 48 * 60 * 60 * 1000);

  const chartRes = await env.DB.prepare(
    useHours
      ? `
        SELECT
          strftime('%H:00', datetime(ts/1000, 'unixepoch')) AS label,
          COUNT(*) AS clicks,
          MIN(ts) AS sort_ts
        FROM clicks
        ${whereSql}
        GROUP BY label
        ORDER BY sort_ts ASC
        LIMIT 200
        `
      : `
        SELECT
          strftime('%d-%m', datetime(ts/1000, 'unixepoch')) AS label,
          COUNT(*) AS clicks,
          MIN(ts) AS sort_ts
        FROM clicks
        ${whereSql}
        GROUP BY label
        ORDER BY sort_ts ASC
        LIMIT 200
        `
  ).bind(...bind).all();

  const body = JSON.stringify({
    kpis: {
      total_clicks: Number(kpiRow?.total_clicks || 0),
      unique_slugs: Number(kpiRow?.unique_slugs || 0),
      last_ts: kpiRow?.last_ts ? Number(kpiRow.last_ts) : null
    },
    days: (daysRes?.results || []).map(r => ({ day: r.day, clicks: Number(r.clicks || 0) })),
    slugs: (slugsRes?.results || []).map(r => ({ slug: r.slug, clicks: Number(r.clicks || 0) })),
    recent: (recentRes?.results || []).map(r => ({
      ts: Number(r.ts), slug: r.slug, type: r.type, category: r.category, country: r.country
    })),
    chart: {
      unit: useHours ? "hour" : "day",
      series: (chartRes?.results || []).map(r => ({ label: r.label, clicks: Number(r.clicks || 0) }))
    }
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

// YYYY-MM-DD -> local start of day (ms)
function parseDateLocalStart(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return Number.isFinite(dt.getTime()) ? dt.getTime() : null;
}

// YYYY-MM-DD -> local end of day (ms)
function parseDateLocalEnd(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isFinite(dt.getTime()) ? dt.getTime() : null;
}
