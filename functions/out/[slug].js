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
    shine: { site: "https://glp8.net/c/?si=21197&li=1903309&wi=415660&ws=", info: "https://boekhouder-vergelijken.nl/articles/shine-co-review-2026" },
    myfinance: { site: "https://lt45.net/c/?si=12956&li=1571606&wi=415660&ws=&dl=", info: "https://boekhouder-vergelijken.nl/articles/myfinance-review-2026" },
    snelstart: { site: "https://jf79.net/c/?si=16383&li=1703816&wi=415660&ws=&dl=", info: "https://jf79.net/c/?si=16383&li=1703816&wi=415660&ws=&dl=" },
    rompslomp: { site: "https://lt45.net/c/?si=11894&li=1532720&wi=415660&ws=", info: "https://boekhouder-vergelijken.nl/articles/rompslomp-review-2026" },
    bunni: { site: "https://jf79.net/c/?si=16546&li=1710742&wi=415660&ws=&dl=", info: "https://jf79.net/c/?si=16546&li=1710742&wi=415660&ws=&dl=" },
    visma: { site: "https://lt45.net/c/?si=11068&li=1492000&wi=415660&ws=&dl=eaccounting%2F", info: "https://lt45.net/c/?si=11068&li=1492000&wi=415660&ws=&dl=eaccounting%2F" },
    jortt: { site: "https://jf79.net/c/?si=16611&li=1713658&wi=415660&ws=&dl=", info: "https://jf79.net/c/?si=16611&li=1713658&wi=415660&ws=&dl=" },
    moneybird: { site: "https://bdt9.net/c/?si=19080&li=1819984&wi=415660&ws=&dl=aanmelden%2F", info: "https://bdt9.net/c/?si=19080&li=1819984&wi=415660&ws=&dl=aanmelden%2F" },

    "e-boekhouden": {
      nl: { site: "https://www.e-boekhouden.nl/p/eenvoudig-online-boekhouden?prtnr=8994&utm_source=www.boekhouder-vergelijken.nl&utm_medium=affiliate&utm_campaign=clicks.nu-8994", info: "https://boekhouder-vergelijken.nl/articles/e-boekhouden-review-2026" },
      be: { site: "https://www.e-boekhouden.be/boekhoudprogramma?prtnr=8994&utm_source=www.boekhouder-vergelijken.nl&utm_medium=affiliate&utm_campaign=clicks.nu-8994", info: "https://boekhouder-vergelijken.be/articles/e-boekhouden-be-review-2026" }
    },
    silvasoft: {
  nl: {
    site: "https://www.silvasoft.nl/?src-rf=1_gvergel",
    info: "https://www.silvasoft.nl/?src-rf=1_gvergel"
  },
  be: {
    site: "https://www.silvasoft.be/?src-rf=1_gvergbe",
    info: "https://www.silvasoft.be/?src-rf=1_gvergbe"
  }
},


    yuki: { site: "https://www.yukisoftware.com/", info: "https://www.yukisoftware.com/" },
    exact: { site: "https://www.exact.com/nl", info: "https://www.exact.com/nl" },
    informer: { site: "https://www.informer.nl/", info: "https://www.informer.nl/" },
    snelstart: { site: "https://www.snelstart.nl/", info: "https://www.snelstart.nl/" },

    // BE slugs handled centrally on NL
    accountable: { site: "https://www.awin1.com/cread.php?awinmid=118873&awinaffid=2717422&ued=https%3A%2F%2Fwww.accountable.eu%2Fnl-be%2F", info: "https://boekhouder-vergelijken.be/articles/accountable-review-2026" },
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