function adHtml(ad) {
  return `
    <a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="c-ad">
      <img src="${ad.image}" alt="${ad.alt || "Advertentie"}" loading="lazy" class="c-ad__img">
    </a>
  `;
}

export function renderAds(ads) {
  const left = document.getElementById("leftAds");
  const right = document.getElementById("rightAds");

  if (!left && !right) return;

  const leftAds = (ads || []).filter(a => a.position === "left");
  const rightAds = (ads || []).filter(a => a.position === "right");

  if (left) left.innerHTML = leftAds.map(adHtml).join("");
  if (right) right.innerHTML = rightAds.map(adHtml).join("");
}
