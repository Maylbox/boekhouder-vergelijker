import { fetchJSON } from "./data/api.js";
import { store } from "./state/store.js";
import { filterAccountants, sortAccountants } from "./logic/filterSort.js";
import { initNavMenu } from "./ui/navMenu.js";
import { renderAds } from "./ui/renderAds.js";
import { renderCards } from "./ui/renderCards.js";
import { renderArticles } from "./ui/renderArticles.js";


function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
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

function getMarket() {
  const host = window.location.hostname.toLowerCase();
  // works for boekhouder-vergelijken.be and any subdomain like www.
  if (host === "boekhouder-vergelijken.be" || host.endsWith(".be")) return "be";
  return "nl";
}

function getAccountantsPath() {
  return getMarket() === "be"
    ? "/data/accountants-be.json"
    : "/data/accountants-nl.json";
}

async function initIndexPage() {
  const resultsEl = document.getElementById("results");
  if (!resultsEl) return;

  store.accountants = await fetchJSON(getAccountantsPath());
  renderCards(resultsEl, store.accountants);
}


async function initArticlesPage() {
  const listEl = document.querySelector(".article-list, .c-articles__grid");
  if (!listEl) return;

  store.articles = await fetchJSON("./data/articles.json");
  renderArticles(listEl, store.articles);
}

document.addEventListener("DOMContentLoaded", async () => {
  setYear();

  try {
    const injected = await injectHeader();
    if (injected) initNavMenu(); // only init if header exists

    await initIndexPage();
    await initArticlesPage();
  } catch (err) {
    console.error(err);
  }
});

