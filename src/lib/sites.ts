export type Site = {
  siteId: number;
  name: string;
  domain: string;
  favicon: string;
};

export const SITES: Record<number, Site> = {
  2: {
    siteId: 2,
    name: "Impecca",
    domain: "impecca.com",
    favicon:
      "https://impecca.com/media/favicon/stores/2/favicon-impecca.png",
  },
  3: {
    siteId: 3,
    name: "Rip-Tunes",
    domain: "rip-tunes.com",
    favicon:
      "https://rip-tunes.com/media/favicon/stores/3/favicon-riptunes.png",
  },
  11: {
    siteId: 11,
    name: "Courant",
    domain: "courantusa.com",
    favicon:
      "https://courantusa.com/media/favicon/stores/11/favicon-courant.jpg",
  },
};

export function getSite(siteId: number | null | undefined): Site | undefined {
  return siteId == null ? undefined : SITES[siteId];
}

export function siteSearchUrl(
  site: Site | undefined,
  sku: string | null | undefined,
): string | undefined {
  if (!site || !sku) return undefined;
  const trimmed = sku.trim();
  if (!trimmed) return undefined;
  return `https://${site.domain}/catalogsearch/result/?q=${encodeURIComponent(trimmed)}`;
}
