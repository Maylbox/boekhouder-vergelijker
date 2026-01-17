import { fetchJSON } from "./data/api.js";
import { store } from "./state/store.js";
import { filterAccountants, sortAccountants } from "./logic/filterSort.js";
import { initNavMenu } from "./ui/navMenu.js";
import { renderAds } from "./ui/renderAds.js";
import { renderCards } from "./ui/renderCards.js";
import { renderArticles } from "./ui/renderArticles.js";

/**
 * Market config: alles wat verschilt per .nl / .be zet je hier.
 * Je kunt later ook labels, teksten, categories, affiliate urls, etc. toevoegen.
 */
const MARKET_CONFIG = {
  nl: {
    domain: "boekhouder-vergelijken.nl",
    lang: "nl",
    title: "Boekhouder Vergelijken – Vergelijk boekhouders & boekhoudsoftware",
    description:
      "Vergelijk boekhouders en boekhoudsoftware op prijs, doelgroep en beoordeling. Vind snel wat bij jouw onderneming past.",
    ogImage: "https://boekhouder-vergelijken.nl/public/img/og-default.jpg",
    footerText: "boekhouder-vergelijken.nl",
    accountantsPath: "/data/accountants-nl.json",

    // NEW:
    articlesPath: "/data/articles-nl.json",
    articlesPage: "/articles.html",
  },
  be: {
    domain: "boekhouder-vergelijken.be",
    lang: "nl",
    title: "Boekhouder Vergelijken België – Vergelijk boekhouders & boekhoudsoftware",
    description:
      "Vergelijk boekhouders en boekhoudsoftware in België op prijs, doelgroep en beoordeling.",
    ogImage: "https://boekhouder-vergelijken.be/public/img/og-default.jpg",
    footerText: "boekhouder-vergelijken.be",
    accountantsPath: "/data/accountants-be.json",

    // NEW:
    articlesPath: "/data/articles-be.json",
    articlesPage: "/artikelen.html",
  },
};


function getMarket() {
  const host = window.location.hostname.toLowerCase();
  // boekhouder-vergelijken.be en subdomeinen (www.)
  if (host === "boekhouder-vergelijken.be" || host.endsWith(".be")) return "be";
  return "nl";
}

function getCfg() {
  return MARKET_CONFIG[getMarket()] ?? MARKET_CONFIG.nl;
}

function setYearAndFooter() {
  const year = String(new Date().getFullYear());

  const y = document.getElementById("year");
  if (y) y.textContent = year;

  // optioneel: pas footer tekst aan naar enkel het juiste domein
  const cfg = getCfg();
  const footerP = document.querySelector(".c-footer p");
  if (footerP) footerP.textContent = `© ${year} ${cfg.footerText}`;
}

/**
 * Update meta/canonical/og/twitter voor de juiste market.
 * Let op: crawlers kunnen soms minder houden van client-side meta changes,
 * maar dit is praktisch en werkt prima voor socials/clients.
 */
function isArticlesPage() {
  const p = (window.location.pathname || "/").toLowerCase();
  return p.endsWith("/articles.html") || p.endsWith("/artikelen.html");
}

function applyMarketMeta() {
  const cfg = getCfg();

  document.documentElement.lang = cfg.lang || "nl";

  // page-specific meta
  const onArticles = isArticlesPage();

  const pageTitle = onArticles
    ? (cfg.articlesTitle ?? "Artikelen over Boekhouden – Boekhouder Vergelijken")
    : cfg.title;

  const pageDesc = onArticles
    ? (cfg.articlesDescription ??
       "Praktische artikelen over boekhouden, online boekhoudsoftware en het kiezen van de juiste boekhouder.")
    : cfg.description;

  const pagePath = onArticles ? cfg.articlesPage : "/";

  document.title = pageTitle;

  const setAttr = (sel, attr, value) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute(attr, value);
  };

  setAttr('meta[name="description"]', "content", pageDesc);
  setAttr('link[rel="canonical"]', "href", `https://${cfg.domain}${pagePath}`);

  setAttr('meta[property="og:site_name"]', "content", "Boekhouder Vergelijken");
  setAttr('meta[property="og:title"]', "content", pageTitle);
  setAttr('meta[property="og:description"]', "content", pageDesc);
  setAttr('meta[property="og:url"]', "content", `https://${cfg.domain}${pagePath}`);
  setAttr('meta[property="og:image"]', "content", cfg.ogImage);

  setAttr('meta[name="twitter:card"]', "content", "summary_large_image");
  setAttr('meta[name="twitter:title"]', "content", pageTitle);
  setAttr('meta[name="twitter:description"]', "content", pageDesc);
  setAttr('meta[name="twitter:image"]', "content", cfg.ogImage);
}


async function injectHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return false;

  const key = "bv_header_v1";

  if (!sessionStorage.getItem(key) && mount.innerHTML.trim()) {
    sessionStorage.setItem(key, mount.innerHTML);
  }

  if (mount.innerHTML.trim()) return true;

  const res = await fetch("/partials/header.html?v=1");
  if (!res.ok) return false;

  const html = await res.text();
  sessionStorage.setItem(key, html);
  mount.innerHTML = html;

  return true;
}

async function initIndexPage() {
  const resultsEl = document.getElementById("results");
  if (!resultsEl) return;

  const cfg = getCfg();

  store.accountants = await fetchJSON(cfg.accountantsPath);

  // als je filtering/sorting later hier wil toepassen:
  // const filtered = filterAccountants(store.accountants, store.filters);
  // const sorted = sortAccountants(filtered, store.sort);
  // renderCards(resultsEl, sorted);

  renderCards(resultsEl, store.accountants);
}

async function initArticlesPage() {
  const listEl = document.querySelector(".article-list, .c-articles__grid");
  if (!listEl) return;

  const cfg = getCfg();
  store.articles = await fetchJSON(cfg.articlesPath);
  renderArticles(listEl, store.articles);
}

document.addEventListener("DOMContentLoaded", async () => {
  // market toepassen voor meta + footer/year
  applyMarketMeta();
  setYearAndFooter();

  try {
    const injected = await injectHeader();
    if (injected) initNavMenu();

    await initIndexPage();
    await initArticlesPage();
  } catch (err) {
    console.error(err);
  }
});
