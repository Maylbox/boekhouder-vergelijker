export async function onRequestGet({ params, request, env }) {
  const url = new URL(request.url);

  const slug = String(params.slug || "").trim().toLowerCase();
  const type = (url.searchParams.get("type") || "site").toLowerCase(); // "site" | "info"

  const DEST = {
    moneymonk: {
      site: "https://www.moneymonk.nl/",
      info: "https://www.moneymonk.nl/"
    },
    moneybird: {
      site: "https://www.moneybird.nl/",
      info: "https://www.moneybird.nl/"
    },
    "e-boekhouden": {
      site: "https://www.e-boekhouden.nl/",
      info: "https://www.e-boekhouden.nl/"
    },
    yuki: {
      site: "https://www.yukisoftware.com/",
      info: "https://www.yukisoftware.com/"
    },
    exact: {
      site: "https://www.exact.com/nl",
      info: "https://www.exact.com/nl"
    },
    informer: {
      site: "https://www.informer.nl/",
      info: "https://www.informer.nl/"
    },
    snelstart: {
      site: "https://www.snelstart.nl/",
      info: "https://www.snelstart.nl/"
    }
  };

  const dest = DEST[slug]?.[type] || DEST[slug]?.site;
  if (!dest) return new Response("Unknown link", { status: 404 });

  const ts = Date.now();
  const id = crypto.randomUUID();

  const ref = request.headers.get("Referer") || "";
  const ua = request.headers.get("User-Agent") || "";

  await env.DB.prepare(
    `INSERT INTO clicks (id, ts, slug, ref_path, ua_family, country, type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      ts,
      slug,
      safePath(ref),
      uaFamily(ua),
      request.cf?.country || null,
      type
    )
    .run();

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
  const s = String(ua || "").toLowerCase();
  if (s.includes("iphone") || s.includes("ipad")) return "ios";
  if (s.includes("android")) return "android";
  if (s.includes("windows")) return "windows";
  if (s.includes("mac")) return "mac";
  if (s.includes("linux")) return "linux";
  return "other";
}
