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

async function initIndexPage() {
  const resultsEl = document.getElementById("results");
  if (!resultsEl) return;

  store.accountants = await fetchJSON("./data/accountants.json");
  renderCards(resultsEl, store.accountants);
}


async function initArticlesPage() {
  const listEl = document.querySelector(".article-list, .c-articles__grid");
  if (!listEl) return;

  store.articles = await fetchJSON("./data/articles.json");
  renderArticles(listEl, store.articles);
}

document.addEventListener("DOMContentLoaded", async () => {
  initNavMenu();
  setYear();

  try {
    await initIndexPage();
    await initArticlesPage();
  } catch (err) {
    console.error(err);
  }
});
