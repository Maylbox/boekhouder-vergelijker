export function normalizePrice(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function filterAccountants(list, term) {
  const t = (term || "").trim().toLowerCase();
  if (!t) return list;

  return list.filter(acc => {
    const haystack = [
      acc.name,
      acc.city,
      acc.country,
      acc.clients,
      ...(acc.features || [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(t);
  });
}

export function sortAccountants(list, sortBy) {
  const copy = [...list];

  copy.sort((a, b) => {
    const priceA = normalizePrice(a.monthlyFee);
    const priceB = normalizePrice(b.monthlyFee);

    switch (sortBy) {
      case "price-asc":
        return priceA - priceB;

      case "price-desc":
        return priceB - priceA;

      case "name-asc":
        return (a.name || "").localeCompare(b.name || "", "nl");

      case "rating-desc":
        return (b.rating || 0) - (a.rating || 0);

      case "sponsored":
      default:
        return (a.sponsoredOrder ?? 9999) - (b.sponsoredOrder ?? 9999);
    }
  });

  return copy;
}
