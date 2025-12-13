function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderCards(container, list) {
  if (!container) return;

  const items = [...(list || [])].sort((a, b) => {
    const ao = Number.isFinite(+a?.sponsoredOrder) ? +a.sponsoredOrder : 9999;
    const bo = Number.isFinite(+b?.sponsoredOrder) ? +b.sponsoredOrder : 9999;
    return ao - bo;
  });

  container.innerHTML = items.map(acc => {
    const name = escapeHtml(acc.name || "");
    const logo = acc.logo ? escapeHtml(acc.logo) : "";
    const city = escapeHtml(acc.city || "");
    const country = escapeHtml(acc.country || "");
    const clients = escapeHtml(acc.clients || "n.v.t.");
    const monthlyFee = acc.monthlyFee ? escapeHtml(acc.monthlyFee) : "";
    const summary = acc.summary ? escapeHtml(acc.summary) : "";
    const moreInfoLink = acc.moreInfoLink ? escapeHtml(acc.moreInfoLink) : "";
    const websiteLink = acc.websiteLink ? escapeHtml(acc.websiteLink) : "";

    const hasLocation = Boolean(acc.city || acc.country);
    const locationText = `${city}${acc.city && acc.country ? ", " : ""}${country}`;

    const ratingNum = acc.rating != null
      ? Number(String(acc.rating).replace(",", "."))
      : NaN;

    const ratingHtml = Number.isFinite(ratingNum)
      ? `<span class="c-badge">★ ${ratingNum.toFixed(1)}</span>`
      : "";

    const priceHtml = monthlyFee
      ? `<div class="c-card__price">€${monthlyFee} p/m</div>`
      : "";

    const topRowHtml = (ratingHtml || priceHtml)
      ? `<div class="c-card__toprow">${priceHtml}${ratingHtml}</div>`
      : "";

    const featuresHtml = (acc.features && acc.features.length)
      ? `<div class="c-card__features">
           ${acc.features.map(f => `<span class="c-pill">${escapeHtml(f)}</span>`).join("")}
         </div>`
      : "";

    const summaryHtml = summary ? `<p class="c-card__summary">${summary}</p>` : "";

    const actionsHtml = `
      <div class="c-card__actions">
        ${moreInfoLink
          ? `<a class="c-btn c-btn--secondary" href="${moreInfoLink}" target="_blank" rel="noopener noreferrer">Meer info</a>`
          : `<span></span>`}
        ${websiteLink
          ? `<a class="c-btn c-btn--primary" href="${websiteLink}" target="_blank" rel="noopener noreferrer">Naar website</a>`
          : `<span></span>`}
      </div>
    `;

    const isFeatured = Number(acc.sponsoredOrder) === 1;

    return `
      <article class="c-card ${isFeatured ? "c-card--featured" : ""}">
        <div class="c-card__header">
          ${logo
            ? `<img src="${logo}" alt="Logo ${name}" class="c-card__logo">`
            : `<div class="c-card__logo"></div>`}

          <div class="c-card__info">
            <h2 class="c-card__title">${name}</h2>
            ${topRowHtml}
            ${hasLocation ? `<div class="c-card__meta">${locationText}</div>` : ""}
            <div class="c-card__meta">Doelgroep: ${clients}</div>
          </div>
        </div>

        ${summaryHtml}
        ${featuresHtml}
        ${actionsHtml}
      </article>
    `;
  }).join("");
}


