import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";

import { getReviewById } from "~/lib/db/queries";
import { getSite, siteSearchUrl } from "~/lib/sites";
import { SiteIcon } from "~/components/site-icon";
import { SiteHeader } from "~/components/site-header";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const useReviewDetail = routeLoader$(async ({ params, status }) => {
  const review = await getReviewById(params.id);
  if (!review) {
    status(404);
  }
  return review;
});

export default component$(() => {
  const data = useReviewDetail();
  const review = data.value;
  const location = useLocation();
  const back = location.url.searchParams.get("back");
  const editHref = back
    ? `/review/${review?.reviewId}/edit?back=${encodeURIComponent(back)}`
    : `/review/${review?.reviewId}/edit`;

  if (!review) {
    return (
      <main class="relative grid min-h-screen place-items-center bg-[#09070f] px-6 text-center text-white">
        <div class="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-10">
          <p class="text-sm text-zinc-400">Review not found.</p>
          <a
            href="/"
            class="mt-4 inline-block rounded-lg bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-400"
          >
            Back to dashboard
          </a>
        </div>
      </main>
    );
  }

  const rating = Math.min(5, Math.max(0, Number(review.rating)));
  const productUrl = review.sku
    ? `/product/${encodeURIComponent(review.sku.trim())}`
    : "/";
  const site = getSite(review.siteId);
  const externalUrl = siteSearchUrl(site, review.sku);

  return (
    <main class="relative min-h-screen overflow-hidden bg-[#09070f] text-white">
      <div class="pointer-events-none absolute -top-52 left-1/3 h-[34rem] w-[34rem] rounded-full bg-violet-700/20 blur-[130px]" />
      <div class="pointer-events-none absolute top-1/3 -right-56 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div class="relative mx-auto w-full max-w-[1080px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <SiteHeader>
          <SiteIcon q:slot="actions" site={site} sku={review.sku} />
          <a
            q:slot="actions"
            href={back ?? "/"}
            class="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
          >
            Back to list
          </a>
        </SiteHeader>

        <section class="pt-10 pb-7 lg:pt-14 lg:pb-9">
          <div class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300 uppercase">
            <span class="h-px w-7 bg-violet-400" />
            Review detail
          </div>
          <h1 class="font-mono text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Review #{review.reviewId}
          </h1>
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={productUrl}
              class="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
            >
              {review.sku ? `Product ${review.sku}` : "View product"}
            </a>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                class="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
              >
                View on {site?.name}
              </a>
            )}
            <a
              href={editHref}
              class="rounded-lg bg-violet-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-400"
            >
              Edit review
            </a>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-white/10 bg-[#100d18]/90 shadow-2xl shadow-black/30">
          <div class="px-6 py-8 sm:px-9">
            <div class="mb-6 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs text-zinc-500">
                <span class="inline-flex items-center gap-1.5">
                  <span class="grid h-6 w-6 place-items-center rounded-full bg-violet-400/15 text-[10px] font-bold text-violet-300">
                    {(review.reviewer ?? "?").trim().charAt(0).toUpperCase()}
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
                <div class="flex items-center gap-0.5" aria-hidden="true">
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

            <dl class="space-y-5">
              {review.title && (
                <div>
                  <dt class="mb-1 text-[10px] font-semibold tracking-[0.16em] text-zinc-600 uppercase">
                    Title
                  </dt>
                  <dd class="text-base font-semibold text-zinc-100">
                    {review.title}
                  </dd>
                </div>
              )}
              {review.detail && (
                <div>
                  <dt class="mb-1 text-[10px] font-semibold tracking-[0.16em] text-zinc-600 uppercase">
                    Review
                  </dt>
                  <dd class="text-sm leading-7 text-zinc-400">
                    {review.detail}
                  </dd>
                </div>
              )}
              <div>
                <dt class="mb-1 text-[10px] font-semibold tracking-[0.16em] text-zinc-600 uppercase">
                  Product SKU
                </dt>
                <dd class="font-mono text-sm text-zinc-300">
                  {review.sku ?? "Unknown"}
                </dd>
              </div>
            </dl>
          </div>
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
  title: "Review Control | Review Detail",
  meta: [
    {
      name: "description",
      content: "Detail of a single Magento customer review.",
    },
  ],
};
