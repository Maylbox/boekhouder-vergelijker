export async function onRequestGet({ params, request, env }) {
  const slug = String(params.slug || "").toLowerCase();

  const DEST = {
    moneymonk: "https://www.moneymonk.nl/",
    moneybird: "https://www.moneybird.nl/",
    "e-boekhouden": "https://www.e-boekhouden.nl/",
    yuki: "https://www.yukisoftware.com/",
    exact: "https://www.exact.com/nl",
    informer: "https://www.informer.nl/",
    snelstart: "https://www.snelstart.nl/"
  };

  const dest = DEST[slug];
  if (!dest) return new Response("Unknown link", { status: 404 });

  const ts = Date.now();
  const id = crypto.randomUUID();

  const ref = request.headers.get("Referer") || "";
  const ua = request.headers.get("User-Agent") || "";

  await env.DB.prepare(
    `INSERT INTO clicks (id, ts, slug, ref_path, ua_family, country)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    ts,
    slug,
    safePath(ref),
    uaFamily(ua),
    request.cf?.country || null
  ).run();

  return Response.redirect(dest, 302);
}

function safePath(ref) {
  try {
    return new URL(ref).pathname;
  } catch {
    return null;
  }
}

function uaFamily(ua) {
  const s = ua.toLowerCase();
  if (s.includes("iphone") || s.includes("ipad")) return "ios";
  if (s.includes("android")) return "android";
  if (s.includes("windows")) return "windows";
  if (s.includes("mac")) return "mac";
  if (s.includes("linux")) return "linux";
  return "other";
}
