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

  const list = [...(articles || [])].sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  );

  container.innerHTML = list.map(a => {
    const title = escapeHtml(a.title);
    const desc = escapeHtml(a.description);
    const thumb = escapeHtml(a.thumbnail);
    const link = escapeHtml(a.content);
    const date = escapeHtml(formatDate(a.date));
    const category = escapeHtml(a.category || "");

    return `
      <article class="c-article-card">
        <img
          class="c-article-card__thumb"
          src="${thumb}"
          alt="${title}"
          loading="lazy"
        >

        <div class="c-article-card__body">
          <div class="c-article-card__meta">
          <span class="c-article-card__date">${date}</span>
          ${category ? `<span class="c-article-card__sep">|</span>` : ""}
          ${category ? `<span class="c-article-card__category">${category}</span>` : ""}
          </div>
          <h3 class="c-article-card__title">${title}</h3>
          <p class="c-article-card__desc">${desc}</p>

          <div class="c-article-card__actions">
            <a class="c-btn c-btn--secondary" href="${link}">
              Lees artikel
            </a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}


