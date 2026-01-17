function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toRatingNumber(value) {
  if (value == null) return NaN;
  return Number(String(value).replace(",", "."));
}

function buildLocation(city, country) {
  const c = escapeHtml(city || "");
  const co = escapeHtml(country || "");
  if (!c && !co) return "";
  if (c && co) return `${c}, ${co}`;
  return c || co;
}
function normalizeLogoPath(logo) {
  const s = String(logo || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s; // extern of inline
  return s.startsWith("/") ? s : `/${s}`; // maak absolute path
}

export function renderCards(container, list) {
  if (!container) return;

  const items = [...(list || [])].sort((a, b) => {
    const ao = Number.isFinite(+a?.sponsoredOrder) ? +a.sponsoredOrder : 9999;
    const bo = Number.isFinite(+b?.sponsoredOrder) ? +b.sponsoredOrder : 9999;
    return ao - bo;
  });

  container.innerHTML = items.map((acc, idx) => {
    const name = escapeHtml(acc.name || "");
    const logo = acc.logo ? escapeHtml(normalizeLogoPath(acc.logo)) : "";

    const clients = escapeHtml(acc.clients || "n.v.t.");
    const summary = acc.summary ? escapeHtml(acc.summary) : "";

    const monthlyFee = acc.monthlyFee ? escapeHtml(acc.monthlyFee) : "";
    const moreInfoLink = acc.moreInfoLink ? escapeHtml(acc.moreInfoLink) : "";

    // NEW: slug-based tracking link
    const slug = acc.slug ? String(acc.slug).trim().toLowerCase() : "";
    const outLink = slug ? `/out/${encodeURIComponent(slug)}` : "";

    const locationText = buildLocation(acc.city, acc.country);

    const ratingNum = toRatingNumber(acc.rating);
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

    const moreInfoBtn = outLink
  ? `<a class="c-btn c-btn--secondary"
       href="${outLink}?type=info"
       target="_blank"
       rel="noopener noreferrer nofollow sponsored">
       Meer info
     </a>`
  : `<span></span>`;

const websiteBtn = outLink
  ? `<a class="c-btn c-btn--primary"
       href="${outLink}?type=site"
       target="_blank"
       rel="noopener noreferrer nofollow sponsored">
       Naar website
     </a>`
  : `<span></span>`;


    const actionsHtml = `
      <div class="c-card__actions">
        ${moreInfoBtn}
        ${websiteBtn}
      </div>
    `;

    const isFeatured = idx < 3;

    const pillBadge =
  acc.badge
    ? (typeof acc.badge === "string"
        ? `<div class="c-pill-badge">${escapeHtml(acc.badge)}</div>`
        : `<div class="c-pill-badge">${escapeHtml(acc.badge.text || "")}</div>`)
    : "";

const badgeText =
  acc.badge
    ? (typeof acc.badge === "string" ? acc.badge : (acc.badge.text || ""))
    : "";

const hasBadge = !!badgeText;

const badgeHtml = hasBadge
  ? `<div class="c-pill-badge">${escapeHtml(badgeText)}</div>`
  : "";

return `
  <article class="c-card ${isFeatured ? "c-card--featured" : ""} ${hasBadge ? "has-badge" : ""}">
    ${hasBadge ? `<div class="c-card__pillwrap"><div class="c-pill-badge">${escapeHtml(badgeText)}</div></div>` : ""}

    <div class="c-card__header">
      ${logo
        ? `<img src="${logo}" alt="Logo ${name}" class="c-card__logo">`
        : `<div class="c-card__logo" aria-hidden="true"></div>`}

      <div class="c-card__info">
        <h2 class="c-card__title">${name}</h2>
        ${topRowHtml}
        ${locationText ? `<div class="c-card__meta">${locationText}</div>` : ""}
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
