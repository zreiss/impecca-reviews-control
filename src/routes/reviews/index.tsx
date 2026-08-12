import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";

import { getProductReviewsPage } from "~/lib/db/queries";
import { ReviewVirtualList } from "~/components/review-virtual-list";
import { SiteHeader } from "~/components/site-header";

export const PAGE_SIZE = 500;

export const useReviewsPage = routeLoader$(async ({ query, redirect }) => {
  const requestedPage = Number.parseInt(query.get("page") ?? "1", 10);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;

  const { rows, total } = await getProductReviewsPage({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const finalPage = Math.min(page, totalPages);
  if (finalPage !== page) {
    throw redirect(302, pageUrl(finalPage));
  }
  return { rows, total, page: finalPage, totalPages };
});

function pageUrl(page: number) {
  return page <= 1 ? "/reviews" : `/reviews?page=${page}`;
}

const numberFormatter = new Intl.NumberFormat("en-US");

export default component$(() => {
  const data = useReviewsPage();
  const { rows, total, page, totalPages } = data.value;
  const location = useLocation();
  const posParam = location.url.searchParams.get("pos");
  const initialScrollTop =
    posParam != null && Number.isFinite(Number(posParam))
      ? Number(posParam)
      : null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <main class="relative min-h-screen overflow-hidden bg-[#09070f] text-white">
      <div class="pointer-events-none absolute -top-52 left-1/3 h-[34rem] w-[34rem] rounded-full bg-violet-700/20 blur-[130px]" />
      <div class="pointer-events-none absolute top-1/3 -right-56 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div class="relative mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <SiteHeader />

        <section class="pt-10 pb-7 lg:pt-14 lg:pb-9">
          <div class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300 uppercase">
            <span class="h-px w-7 bg-violet-400" />
            All reviews
          </div>
          <h1 class="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-5xl">
            Customer reviews<span class="text-fuchsia-400">.</span>
          </h1>
          <p class="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
            {numberFormatter.format(total)} reviews in total, listed in pages
            of {numberFormatter.format(PAGE_SIZE)}.
          </p>
        </section>

        <ReviewVirtualList
          rows={rows}
          page={page}
          initialScrollTop={initialScrollTop}
        />

        <div class="flex flex-col gap-3 border-t border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-zinc-500">
            Showing{" "}
            <span class="font-medium text-zinc-300">
              {numberFormatter.format(from)}–{numberFormatter.format(to)}
            </span>{" "}
            of{" "}
            <span class="font-medium text-zinc-300">
              {numberFormatter.format(total)}
            </span>{" "}
            reviews
          </p>
          <nav
            class="flex items-center gap-2"
            aria-label="Review list pagination"
          >
            {page > 1 ? (
              <a
                href={pageUrl(page - 1)}
                class="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
              >
                Previous
              </a>
            ) : (
              <span class="cursor-not-allowed rounded-lg border border-white/[0.06] px-3.5 py-2 text-xs font-medium text-zinc-700">
                Previous
              </span>
            )}
            <span class="px-2 font-mono text-xs text-zinc-500">
              Page {page} of {numberFormatter.format(totalPages)}
            </span>
            {page < totalPages ? (
              <a
                href={pageUrl(page + 1)}
                class="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
              >
                Next
              </a>
            ) : (
              <span class="cursor-not-allowed rounded-lg border border-white/[0.06] px-3.5 py-2 text-xs font-medium text-zinc-700">
                Next
              </span>
            )}
          </nav>
        </div>

        <footer class="flex items-center justify-between py-6 text-[11px] text-zinc-600">
          <span>Impecca Review Control</span>
          <span>Magento review data</span>
        </footer>
      </div>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Review Control | All Reviews",
  meta: [
    {
      name: "description",
      content: "All Magento customer reviews, paged and virtualized.",
    },
  ],
};
