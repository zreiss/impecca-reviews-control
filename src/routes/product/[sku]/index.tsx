import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";

import { getProductReviewsBySku } from "~/lib/db/queries";
import { getSite, siteSearchUrl } from "~/lib/sites";
import { SiteIcon } from "~/components/site-icon";
import { SiteHeader } from "~/components/site-header";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const useProductReviews = routeLoader$(async ({ params }) => {
  const sku = params.sku;
  return {
    sku,
    reviews: await getProductReviewsBySku(sku),
  };
});

export default component$(() => {
  const data = useProductReviews();
  const { sku, reviews } = data.value;
  const site = getSite(reviews[0]?.siteId);
  const externalUrl = siteSearchUrl(site, sku);

  return (
    <main class="relative min-h-screen overflow-hidden bg-[#09070f] text-white">
      <div class="pointer-events-none absolute -top-52 left-1/3 h-[34rem] w-[34rem] rounded-full bg-violet-700/20 blur-[130px]" />
      <div class="pointer-events-none absolute top-1/3 -right-56 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div class="relative mx-auto w-full max-w-[1080px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <SiteHeader>
          <SiteIcon q:slot="actions" site={site} sku={sku} />
          <a
            q:slot="actions"
            href="/"
            class="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
          >
            Back to dashboard
          </a>
        </SiteHeader>

        <section class="pt-10 pb-7 lg:pt-14 lg:pb-9">
          <div class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300 uppercase">
            <span class="h-px w-7 bg-violet-400" />
            Product detail
          </div>
          <h1 class="font-mono text-3xl font-semibold tracking-[-0.03em] break-all sm:text-4xl">
            {sku}
          </h1>
          <p class="mt-3 text-sm text-zinc-400">
            {reviews.length} customer review{reviews.length === 1 ? "" : "s"}{" "}
            for this SKU
          </p>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              class="mt-4 inline-block rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
            >
              View on {site?.name}
            </a>
          )}
          <a
            href={
              reviews[0]?.entityPkValue
                ? `/product/${encodeURIComponent(sku)}/create?entityPkValue=${reviews[0].entityPkValue}`
                : `/product/${encodeURIComponent(sku)}/create`
            }
            class="mt-4 inline-block rounded-lg bg-violet-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-400"
          >
            Add review
          </a>
        </section>

        <section class="overflow-hidden rounded-2xl border border-white/10 bg-[#100d18]/90 shadow-2xl shadow-black/30">
          {reviews.length === 0 ? (
            <div class="px-6 py-16 text-center text-sm text-zinc-500">
              No reviews found for this SKU.
            </div>
          ) : (
            <ul class="divide-y divide-white/[0.07]">
              {reviews.map((review, index) => {
                const rating = Math.min(5, Math.max(0, Number(review.rating)));

                return (
                  <li
                    key={index}
                    id={`review-${review.reviewId}`}
                    class="scroll-mt-24 border border-transparent px-5 py-6 sm:px-7 target:border-violet-400/70 target:bg-violet-400/[0.06]"
                  >
                    <a
                      href={`/review/${review.reviewId}?back=${encodeURIComponent(`/product/${encodeURIComponent(sku)}/`)}`}
                      class="group block"
                    >
                      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2 text-xs text-zinc-500">
                          <span class="inline-flex items-center gap-1.5">
                            <span class="grid h-6 w-6 place-items-center rounded-full bg-violet-400/15 text-[10px] font-bold text-violet-300">
                              {(review.reviewer ?? "?")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            <span class="font-medium text-zinc-300">
                              {review.reviewer ?? "Anonymous"}
                            </span>
                          </span>
                          <span aria-hidden="true">•</span>
                          <span>
                            {review.createdAt
                              ? dateFormatter.format(new Date(review.createdAt))
                              : "Date unknown"}
                          </span>
                        </div>
                        <div class="flex items-center gap-2">
                          <div
                            class="flex items-center gap-0.5"
                            aria-hidden="true"
                          >
                            {Array.from({ length: 5 }, (_, star) => (
                              <svg
                                key={star}
                                viewBox="0 0 24 24"
                                class={`h-4 w-4 ${
                                  star < Math.round(rating)
                                    ? "text-fuchsia-400"
                                    : "text-white/15"
                                }`}
                                fill="currentColor"
                              >
                                <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.3l6.5-.9L12 2.5Z" />
                              </svg>
                            ))}
                          </div>
                          <span class="font-mono text-xs font-semibold text-violet-200">
                            {Number.isNaN(rating) ? "—" : rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {review.title && (
                        <h2 class="mb-1.5 text-sm font-semibold text-zinc-100">
                          {review.title}
                        </h2>
                      )}
                      {review.detail && (
                        <p class="text-sm leading-6 text-zinc-400">
                          {review.detail}
                        </p>
                      )}

                      <span class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-300/80 transition group-hover:text-violet-200">
                        View review
                        <svg
                          viewBox="0 0 24 24"
                          class="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M9 6l6 6-6 6"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer class="flex items-center justify-between py-6 text-[11px] text-zinc-600">
          <span>Impecca Review Control</span>
          <span>Magento review data</span>
        </footer>
      </div>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Review Control | Product Reviews",
  meta: [
    {
      name: "description",
      content: "Customer reviews for a product SKU.",
    },
  ],
};
