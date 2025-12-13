function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateStr) {
  // expects YYYY-MM-DD
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;

  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(d);
}

export function renderArticles(container, articles) {
  if (!container) return;

  const list = [...(articles || [])].sort((a, b) => {
    return (b.date || "").localeCompare(a.date || "");
  });

  container.innerHTML = list.map(a => `
    <article class="c-article-card">
      <img class="c-article-card__thumb" src="${escapeHtml(a.thumbnail)}" alt="${escapeHtml(a.title)}" loading="lazy">
      <div class="c-article-card__body">
        <div class="c-article-card__date">${escapeHtml(formatDate(a.date))}</div>
        <h3 class="c-article-card__title">${escapeHtml(a.title)}</h3>
        <p class="c-article-card__desc">${escapeHtml(a.description)}</p>
        <a class="c-btn c-btn--secondary" href="${escapeHtml(a.content)}">Lees artikel</a>
      </div>
    </article>
  `).join("");
}
