import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";

import { ReviewTable } from "~/components/review-table";
import { SiteHeader } from "~/components/site-header";
import {
  getAllMagentoProductReviewSummaries,
  type ReviewPresenceFilter,
} from "~/lib/db/queries";

export const useReviews = routeLoader$(async ({ query }) => {
  const search = query.get("search")?.trim().slice(0, 64) ?? "";
  const requestedFilter = query.get("reviews");
  const presence: ReviewPresenceFilter | null = search
    ? null
    : requestedFilter === "with" || requestedFilter === "without"
      ? requestedFilter
      : "with";

  return {
    ...(await getAllMagentoProductReviewSummaries({
      search,
      presence: presence ?? undefined,
    })),
    search,
    presence,
  };
});

function dashboardUrl(search: string, presence: ReviewPresenceFilter | null) {
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  if (presence) params.set("reviews", presence);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

const numberFormatter = new Intl.NumberFormat("en-US");

export default component$(() => {
  const reviews = useReviews();
  const {
    rows,
    products,
    reviews: totalReviews,
    averageRating,
    search,
    presence,
  } = reviews.value;

  const liveSearch = useSignal(search);
  const query = liveSearch.value.trim().toLowerCase();
  const filteredRows = query
    ? rows.filter((row) => row.sku?.toLowerCase().replace(/-/g, "").includes(query.replace(/-/g, "")) ?? false)
    : rows;

  return (
    <main class="relative min-h-screen overflow-x-clip bg-[#09070f] text-white">
      <div class="pointer-events-none absolute -top-52 left-1/3 h-[34rem] w-[34rem] rounded-full bg-violet-700/20 blur-[130px]" />
      <div class="pointer-events-none absolute top-1/3 -right-56 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div class="relative mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <SiteHeader>
          <form q:slot="actions" method="post" action="/auth/signout">
            <button
              type="submit"
              class="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </SiteHeader>

        <section class="pt-3 pb-6 lg:flex lg:items-end lg:justify-between lg:pt-4 lg:pb-7">
          <div>
            <div class="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-violet-300 uppercase">
              <span class="h-px w-5 bg-violet-400" />
              Product intelligence
            </div>
            <h1 class="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Reviews at a glance<span class="text-fuchsia-400">.</span>
            </h1>
          </div>

          <div class="mt-3 flex items-center gap-2 text-xs text-zinc-500 lg:mt-0 lg:pb-1">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live database connection
          </div>
        </section>

        <section class="mb-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-violet-400/15 bg-violet-500/[0.07] p-5 backdrop-blur-sm">
            <p class="text-xs font-medium tracking-wide text-violet-300/70 uppercase">
              Products tracked
            </p>
            <p class="mt-3 text-3xl font-semibold tracking-tight text-violet-200">
              {numberFormatter.format(products)}
            </p>
          </div>
          <div class="rounded-2xl border border-violet-400/15 bg-violet-500/[0.07] p-5 backdrop-blur-sm">
            <p class="text-xs font-medium tracking-wide text-violet-300/70 uppercase">
              Total reviews
            </p>
            <p class="mt-3 text-3xl font-semibold tracking-tight text-violet-200">
              {numberFormatter.format(totalReviews)}
            </p>
          </div>
          <div class="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-500/[0.06] p-5 backdrop-blur-sm">
            <p class="text-xs font-medium tracking-wide text-fuchsia-300/70 uppercase">
              Average rating
            </p>
            <div class="mt-3 flex items-baseline gap-2">
              <p class="text-3xl font-semibold tracking-tight text-fuchsia-200">
                {averageRating.toFixed(1)}
              </p>
              <span class="text-xs text-zinc-500">out of 5</span>
            </div>
          </div>
        </section>

        <section class="mb-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3 backdrop-blur-sm sm:p-4">
          <form
            method="get"
            class="flex flex-col gap-3 lg:flex-row lg:items-center"
          >
            <label class="relative min-w-0 flex-1">
              <span class="sr-only">Search by SKU</span>
              <svg
                viewBox="0 0 24 24"
                class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                  stroke="currentColor"
                  stroke-width="1.7"
                />
                <path
                  d="m16 16 4 4"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
              </svg>
              <input
                type="search"
                name="search"
                value={liveSearch.value}
                onInput$={(_, element) => {
                  liveSearch.value = element.value;
                }}
                placeholder="Search product SKU..."
                class="h-11 w-full rounded-xl border border-white/10 bg-[#0c0912] pr-4 pl-10 text-sm text-white transition outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
              />
            </label>
            <button
              type="submit"
              class="h-11 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white transition hover:bg-violet-400 focus:ring-2 focus:ring-violet-400/40 focus:outline-none"
            >
              Search
            </button>
            {search && (
              <a
                href={dashboardUrl("", presence)}
                class="grid h-11 place-items-center rounded-xl border border-white/10 px-4 text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                Clear
              </a>
            )}
          </form>

          <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3">
            <span class="mr-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-600 uppercase">
              Reviews
            </span>
            {(["with", "without"] as const).map((filter) => {
              const active = presence === filter;
              return (
                <a
                  key={filter}
                  href={dashboardUrl("", active ? null : filter)}
                  aria-pressed={active}
                  class={
                    active
                      ? "rounded-lg border border-violet-400/30 bg-violet-400/15 px-3 py-1.5 text-xs font-medium text-violet-200"
                      : "rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-white/10 hover:text-zinc-300"
                  }
                >
                  {filter === "with" ? "With reviews" : "Without reviews"}
                </a>
              );
            })}
          </div>
        </section>

        <ReviewTable
          rows={filteredRows}
          subtitle={
            presence === "with"
              ? "Products with reviews"
              : presence === "without"
                ? "Products without reviews"
                : "All products — with and without reviews"
          }
        />

        <footer class="flex items-center justify-between py-6 text-[11px] text-zinc-600">
          <span>Impecca Review Control</span>
          <span>Magento review data</span>
        </footer>
      </div>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Review Control | Product Review Summary",
  meta: [
    {
      name: "description",
      content:
        "Product review performance and activity across the Impecca catalog.",
    },
  ],
};
