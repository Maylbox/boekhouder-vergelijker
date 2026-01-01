export async function onRequestGet({ params, request }) {
  const slug = String(params.slug || "").trim().toLowerCase();
  const url = new URL(request.url);

  // Forward all /out/* traffic from .be to the .nl handler, preserving query params
  const target = new URL(`https://boekhouder-vergelijken.nl/out/${encodeURIComponent(slug)}`);
  target.search = url.search;

  return Response.redirect(target.toString(), 302);
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
