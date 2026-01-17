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
    footerText: "boekhouder-vergelijken.nl",


    title: "Boekhoudprogramma vergelijken – Vind de beste boekhoudsoftware",
    description:
      "Boekhoudprogramma vergelijken? Vergelijk de beste boekhoudsoftware voor zzp’ers en mkb op prijs, functies en gebruiksgemak. Actueel overzicht.",

    ogImage: "https://boekhouder-vergelijken.nl/public/img/og-default.jpg",

    accountantsPath: "/data/accountants-nl.json",
    articlesPath: "/data/articles-nl.json",

    articlesPage: "/articles",
    articlesTitle: "Artikelen over Boekhouden – Boekhouder Vergelijken",
    articlesDescription:
      "Praktische artikelen over boekhouden, online boekhoudsoftware en het kiezen van de juiste oplossing voor zzp’ers en mkb.",


    homeH1:
      "Vind de beste boekhoudsoftware voor jouw bedrijf",
    homeIntro:
      "Op zoek naar het beste boekhoudprogramma? Wij helpen je boekhoudprogramma’s vergelijken op prijs, functies, gebruiksgemak en geschiktheid voor zzp’ers en mkb. Of je nu een eenvoudige online boekhouding zoekt of uitgebreide boekhoudsoftware met facturatie en btw-aangifte: bij ons vind je een actueel overzicht. Zo kies je snel het boekhoudprogramma dat past bij jouw onderneming.",
  },

  be: {
    domain: "boekhouder-vergelijken.be",
    lang: "nl",
    footerText: "boekhouder-vergelijken.be",


    title: "Boekhoudprogramma vergelijken – Vind de beste boekhoudsoftware",
    description:
      "Vergelijk boekhoudsoftware voor zelfstandigen en KMO’s op prijs, functies en gebruiksgemak.",

    ogImage: "https://boekhouder-vergelijken.be/public/img/og-default.jpg",

    accountantsPath: "/data/accountants-be.json",
    articlesPath: "/data/articles-be.json",

    articlesPage: "/articles",
    articlesTitle: "Artikelen over Boekhouden in België – Boekhouder Vergelijken",
    articlesDescription:
      "Praktische artikelen voor zelfstandigen en KMO’s in België over boekhouden, btw, e-facturatie en Peppol.",

    homeH1:
      "Boekhoudprogramma vergelijken? Vind de beste boekhoudsoftware voor jouw bedrijf",
    homeIntro:
      "Op zoek naar het beste boekhoudprogramma? Wij helpen je boekhoudprogramma’s vergelijken op prijs, functies, gebruiksgemak en geschiktheid voor eenmanszaken of bv’s. Of je nu een eenvoudige online boekhouding zoekt of uitgebreide boekhoudsoftware met facturatie en btw-aangifte: bij ons vind je een actueel overzicht. Zo kies je snel het boekhoudprogramma dat past bij jouw onderneming.",
  },
};


function setYearAndFooter() {
  const year = String(new Date().getFullYear());

  const y = document.getElementById("year");
  if (y) y.textContent = year;

  const cfg = getCfg();
  const footerP = document.querySelector(".c-footer p");
  if (footerP) footerP.textContent = `© ${year} ${cfg.footerText}`;
}


function getMarket() {
  const host = window.location.hostname.toLowerCase();
  if (host === "boekhouder-vergelijken.be" || host.endsWith(".be")) return "be";
  return "nl";
}

function getCfg() {
  return MARKET_CONFIG[getMarket()] ?? MARKET_CONFIG.nl;
}

function isArticlesPage() {
  const p = (window.location.pathname || "/").toLowerCase();
  const path = p !== "/" ? p.replace(/\/+$/, "") : p; // strip trailing slash
  return path === "/articles" || path.endsWith("/articles.html");
}



function ensureMeta(name, attr = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  return el;
}

function ensureLink(rel) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  return el;
}

function setMetaContent(selectorOrEl, value) {
  const el =
    typeof selectorOrEl === "string"
      ? document.querySelector(selectorOrEl)
      : selectorOrEl;
  if (el) el.setAttribute("content", value);
}

function applyMarketMeta() {
  const cfg = getCfg();
  const onArticles = isArticlesPage();

  const pageTitle = onArticles ? cfg.articlesTitle : cfg.title;
  const pageDesc = onArticles ? cfg.articlesDescription : cfg.description;
  const pagePath = onArticles ? cfg.articlesPage : "/";

  const pageUrl = `https://${cfg.domain}${pagePath}`;

  // html lang + title
  document.documentElement.lang = cfg.lang || "nl";
  document.title = pageTitle;

  // description + canonical
  setMetaContent(ensureMeta("description"), pageDesc);
  ensureLink("canonical").setAttribute("href", pageUrl);

  // robots (laat bestaan als je 'm al hebt)
  if (!document.querySelector('meta[name="robots"]')) {
    setMetaContent(ensureMeta("robots"), "index,follow");
  }

  // Open Graph
  setMetaContent(ensureMeta("og:site_name", "property"), "Boekhouder Vergelijken");
  setMetaContent(ensureMeta("og:type", "property"), "website");

  // locale (optioneel; NL vs BE)
  setMetaContent(
    ensureMeta("og:locale", "property"),
    getMarket() === "be" ? "nl_BE" : "nl_NL"
  );

  setMetaContent(ensureMeta("og:title", "property"), pageTitle);
  setMetaContent(ensureMeta("og:description", "property"), pageDesc);
  setMetaContent(ensureMeta("og:url", "property"), pageUrl);
  setMetaContent(ensureMeta("og:image", "property"), cfg.ogImage);

  // Twitter
  setMetaContent(ensureMeta("twitter:card"), "summary_large_image");
  setMetaContent(ensureMeta("twitter:title"), pageTitle);
  setMetaContent(ensureMeta("twitter:description"), pageDesc);
  setMetaContent(ensureMeta("twitter:image"), cfg.ogImage);
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

function applyHomeIntro() {
  // alleen op de index waar #results bestaat
  const resultsEl = document.getElementById("results");
  if (!resultsEl) return;

  const cfg = getCfg();

  const h1 = document.getElementById("page-title");
  if (h1 && cfg.homeH1) h1.textContent = cfg.homeH1;

  const intro = document.getElementById("page-intro");
  if (intro && cfg.homeIntro) intro.textContent = cfg.homeIntro;
}


document.addEventListener("DOMContentLoaded", async () => {
  applyMarketMeta();
  setYearAndFooter();
  applyHomeIntro(); 

  try {
    const injected = await injectHeader();
    if (injected) initNavMenu();

    await initIndexPage();
    await initArticlesPage();
  } catch (err) {
    console.error(err);
  }
});

