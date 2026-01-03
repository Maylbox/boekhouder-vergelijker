export async function onRequestGet({ params, request, env }) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  const slug = String(params.slug || "").trim().toLowerCase();
  const type = (url.searchParams.get("type") || "site").toLowerCase(); // "site" | "info"
  const category = safeCategory(url.searchParams.get("cat"));

  // 1) If BE domain: forward to NL handler, and mark market=be (preserve query)
  if (host === "boekhouder-vergelijken.be" || host.endsWith(".be")) {
    const target = new URL(`https://boekhouder-vergelijken.nl/out/${encodeURIComponent(slug)}`);

    // copy all query params
    target.search = url.search;

    // ensure market is set for NL handler
    target.searchParams.set("m", "be");

    return Response.redirect(target.toString(), 302);
  }

  // 2) Otherwise (NL): handle normally
  const market = (url.searchParams.get("m") || "nl").toLowerCase(); // "nl" | "be"

  const DEST = {
    moneymonk: { site: "https://www.moneymonk.nl/", info: "https://www.moneymonk.nl/" },
    moneybird: { site: "https://www.moneybird.nl/", info: "https://www.moneybird.nl/" },

    "e-boekhouden": {
      nl: { site: "https://www.e-boekhouden.nl/", info: "https://www.e-boekhouden.nl/" },
      be: { site: "https://www.e-boekhouden.be/", info: "https://www.e-boekhouden.be/" }
    },

    yuki: { site: "https://www.yukisoftware.com/", info: "https://www.yukisoftware.com/" },
    exact: { site: "https://www.exact.com/nl", info: "https://www.exact.com/nl" },
    informer: { site: "https://www.informer.nl/", info: "https://www.informer.nl/" },
    snelstart: { site: "https://www.snelstart.nl/", info: "https://www.snelstart.nl/" },

    // BE slugs handled centrally on NL
    accountable: { site: "https://www.accountable.eu/r/?ref=mwixntc", info: "https://www.accountable.eu/r/?ref=mwixntc" },
    dexxter: { site: "https://dexxter.cello.so/rxGpcjs3LCN", info: "https://dexxter.cello.so/rxGpcjs3LCN" }
  };

  const entry = DEST[slug];

  const dest =
    entry?.[market]?.[type] ||
    entry?.[market]?.site ||
    entry?.[type] || // fallback for single-market entries
    entry?.site;

  if (!dest) return new Response("Unknown link", { status: 404 });

  // log click (only if DB exists)
  if (env?.DB) {
    const ts = Date.now();
    const id = crypto.randomUUID();
    const ref = request.headers.get("Referer") || "";
    const ua = request.headers.get("User-Agent") || "";

    await env.DB.prepare(
      `INSERT INTO clicks (id, ts, slug, ref_path, ua_family, country, type, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        ts,
        slug,
        safePath(ref),
        uaFamily(ua),
        request.cf?.country || null,
        type,
        category
      )
      .run();
  }

  return Response.redirect(dest, 302);
}

function safeCategory(cat) {
  const v = String(cat || "").trim().toLowerCase();
  const ALLOWED = new Set(["article", "homepage", "comparison", "directory", "other"]);
  return ALLOWED.has(v) ? v : "other";
}

function safePath(ref) {
  try {
    return new URL(ref).pathname;
  } catch {
    return null;
  }
}

function uaFamily(ua) {
  const s = String(ua || "").toLowerCase();
  if (s.includes("iphone") || s.includes("ipad")) return "ios";
  if (s.includes("android")) return "android";
  if (s.includes("windows")) return "windows";
  if (s.includes("mac")) return "mac";
  if (s.includes("linux")) return "linux";
  return "other";
}
