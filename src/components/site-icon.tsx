import { component$ } from "@builder.io/qwik";

import { siteSearchUrl, type Site } from "~/lib/sites";

export const SiteIcon = component$(
  (props: { site?: Site; sku?: string | null }) => {
    const { site, sku } = props;
    if (!site) return null;
    const href = siteSearchUrl(site, sku) ?? `https://${site.domain}`;

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={`Open ${site.name} store`}
        class="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition hover:border-violet-400/40 hover:bg-violet-400/10"
      >
        <img
          src={site.favicon}
          alt={site.name}
          width="20"
          height="20"
          loading="lazy"
          class="h-5 w-5 object-contain"
        />
      </a>
    );
  },
);
