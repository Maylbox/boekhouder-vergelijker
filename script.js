let accountants = [];
let ads = [];

async function loadData() {
  try {
    const res = await fetch('data.json');
    accountants = await res.json();
    setupUI();
    renderList();
  } catch (e) {
    console.error('Kon data.json niet laden', e);
  }
}

async function loadAds() {
  try {
    const res = await fetch('ads.json');
    ads = await res.json();
    renderAds();
  } catch (e) {
    console.error('Kon ads.json niet laden', e);
  }
}

function renderAds() {
  const leftContainer = document.getElementById('leftAds');
  const rightContainer = document.getElementById('rightAds');

  if (!leftContainer && !rightContainer) return;

  const leftAds = ads.filter(ad => ad.position === 'left');
  const rightAds = ads.filter(ad => ad.position === 'right');

  const renderAdHtml = ad => `
    <a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-banner">
      <img src="${ad.image}" alt="${ad.alt}" loading="lazy">
    </a>
  `;

  if (leftContainer) {
    leftContainer.innerHTML = leftAds.map(renderAdHtml).join('');
  }

  if (rightContainer) {
    rightContainer.innerHTML = rightAds.map(renderAdHtml).join('');
  }
}


function setupUI() {
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');

  searchInput.addEventListener('input', () => renderList());
  sortSelect.addEventListener('change', () => renderList());
}

function renderList() {
  const container = document.getElementById('results');
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const sortBy = document.getElementById('sortSelect').value;

  let list = accountants.filter(acc => {
    const haystack = [
      acc.name,
      acc.city,
      acc.country,
      acc.clients,
      ...(acc.features || [])
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchTerm);
  });

  function normalizePrice(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return parseFloat(value.replace(",", "."));
  }
  return 0;
}

  list.sort((a, b) => {
  const priceA = normalizePrice(a.monthlyFee);
  const priceB = normalizePrice(b.monthlyFee);

  switch (sortBy) {
    case 'price-asc':
      return priceA - priceB;

    case 'price-desc':
      return priceB - priceA;

    case 'name-asc':
      return a.name.localeCompare(b.name);

    case 'rating-desc':
      return (b.rating || 0) - (a.rating || 0);

    case 'sponsored':
    default:
      const orderA = a.sponsoredOrder ?? 9999;
      const orderB = b.sponsoredOrder ?? 9999;
      return orderA - orderB;
  }
});



  container.innerHTML = list
  .map(
    acc => `
      <article class="card">
        <div>
          <div class="card-header">
            ${
              acc.logo
                ? `<img src="${acc.logo}" alt="Logo ${acc.name}" class="card-logo">`
                : `<div class="card-logo"></div>`
            }
            <div class="card-info">
              <h2>${acc.name}</h2>
              <div class="meta">
                ${acc.city || ''}${acc.city && acc.country ? ', ' : ''}${acc.country || ''}
              </div>
              <div class="meta">Doelgroep: ${acc.clients || 'n.v.t.'}</div>
              <div class="price">€${acc.monthlyFee} p/m</div>
            </div>
            ${
              acc.rating
                ? `<span class="badge">★ ${acc.rating.toFixed(1)}</span>`
                : ''
            }
          </div>
          ${
            acc.summary
              ? `<p class="summary">${acc.summary}</p>`
              : ''
          }
          ${
            acc.features && acc.features.length
              ? `<div class="features">
                  ${acc.features.map(f => `<span>${f}</span>`).join('')}
                 </div>`
              : ''
          }
        </div>
        <div class="card-actions">
          <a class="btn btn-secondary" href="${acc.moreInfoLink}" target="_blank" rel="noopener noreferrer">
            Meer info
          </a>
          <a class="btn btn-primary" href="${acc.websiteLink}" target="_blank" rel="noopener noreferrer">
            Naar website
          </a>
        </div>
      </article>
    `
  )
  .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadAds();
});

