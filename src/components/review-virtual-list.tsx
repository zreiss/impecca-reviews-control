import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { ProductReviewRow } from "~/lib/db/queries";
import { getSite, siteSearchUrl } from "~/lib/sites";

const ROW_HEIGHT = 60;
const OVERSCAN = 6;

const REVIEW_STATUSES: Record<number, string> = {
  1: "Approved",
  2: "Pending",
  3: "Not Approved",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type ReviewVirtualListProps = {
  rows: ProductReviewRow[];
};

export const ReviewVirtualList = component$<ReviewVirtualListProps>(
  ({ rows }) => {
    const scrollTop = useSignal(0);
    const viewportHeight = useSignal(640);
    const scrollRef = useSignal<HTMLElement | undefined>(undefined);

    useVisibleTask$(({ cleanup }) => {
      const element = scrollRef.value;
      if (!element) return;

      const measure = () => {
        viewportHeight.value = element.clientHeight;
      };
      measure();

      const observer = new ResizeObserver(measure);
      observer.observe(element);
      cleanup(() => observer.disconnect());
    });

    const totalRows = rows.length;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN,
    );
    const endIndex = Math.min(
      totalRows,
      Math.ceil((scrollTop.value + viewportHeight.value) / ROW_HEIGHT) +
        OVERSCAN,
    );
    const visibleRows = rows.slice(startIndex, endIndex);

    return (
      <div class="overflow-hidden rounded-2xl border border-white/10 bg-[#100d18]/90 shadow-2xl shadow-black/30">
        <div
          ref={scrollRef}
          onScroll$={(_, element) => {
            scrollTop.value = element.scrollTop;
          }}
          tabIndex={0}
          aria-label="Virtualized review list"
          class="h-[64vh] min-h-[360px] overflow-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
        >
          <table class="w-full min-w-[820px] border-separate border-spacing-0 text-left">
            <thead class="sticky top-0 z-10">
              <tr class="bg-[#141120] text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                <th class="w-24 border-b border-white/10 px-6 py-4">Review</th>
                <th class="border-b border-white/10 px-4 py-4">Product SKU</th>
                <th class="w-44 border-b border-white/10 px-4 py-4">Reviewer</th>
                <th class="w-20 border-b border-white/10 px-4 py-4">Rating</th>
                <th class="w-32 border-b border-white/10 px-4 py-4">Status</th>
                <th class="w-40 border-b border-white/10 px-6 py-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {startIndex > 0 && (
                <tr aria-hidden="true">
                  <td
                    colSpan={6}
                    style={{
                      height: `${startIndex * ROW_HEIGHT}px`,
                      padding: 0,
                    }}
                  />
                </tr>
              )}

              {visibleRows.map((row, index) => {
                const rowIndex = startIndex + index;
                const rating = Math.min(5, Math.max(0, Number(row.rating)));
                const site = getSite(row.siteId);
                const externalUrl = siteSearchUrl(site, row.sku);

                return (
                  <tr
                    key={`${row.reviewId}-${rowIndex}`}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    class="group transition-colors hover:bg-violet-400/[0.045]"
                  >
                    <td class="border-b border-white/[0.06] px-6 py-4">
                      <a
                        href={`/review/${row.reviewId}`}
                        class="font-mono text-xs font-semibold text-violet-200 transition group-hover:text-violet-100"
                      >
                        #{row.reviewId}
                      </a>
                    </td>
                    <td class="border-b border-white/[0.06] px-4 py-4">
                      <div class="flex items-center gap-3">
                        {site ? (
                          <a
                            href={externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={`Open ${site.name} store`}
                            class="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition group-hover:border-violet-400/30 group-hover:bg-violet-400/10"
                          >
                            <img
                              src={site.favicon}
                              alt={site.name}
                              width="14"
                              height="14"
                              loading="lazy"
                              class="h-4 w-4 object-contain"
                            />
                          </a>
                        ) : (
                          <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-violet-300" />
                        )}
                        {row.sku ? (
                          <a
                            href={`/product/${encodeURIComponent(row.sku.trim())}`}
                            class="font-mono text-sm font-medium text-zinc-200 underline-offset-4 transition hover:text-violet-300 hover:underline"
                          >
                            {row.sku.trim()}
                          </a>
                        ) : (
                          <span class="font-mono text-sm font-medium text-zinc-200">
                            Unknown SKU
                          </span>
                        )}
                      </div>
                    </td>
                    <td class="border-b border-white/[0.06] px-4 py-4 text-sm text-zinc-400">
                      {row.reviewer ?? "Anonymous"}
                    </td>
                    <td class="border-b border-white/[0.06] px-4 py-4">
                      <span
                        class={`inline-flex min-w-10 justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                          rating >= 4
                            ? "bg-emerald-400/15 text-emerald-300"
                            : rating >= 2
                              ? "bg-amber-400/15 text-amber-300"
                              : "bg-red-400/15 text-red-300"
                        }`}
                      >
                        {Number.isNaN(rating) ? "—" : rating.toFixed(1)}
                      </span>
                    </td>
                    <td class="border-b border-white/[0.06] px-4 py-4">
                      <span
                        class={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${
                          row.statusId === 1
                            ? "bg-emerald-400/10 text-emerald-300"
                            : row.statusId === 2
                              ? "bg-amber-400/10 text-amber-300"
                              : "bg-red-400/10 text-red-300"
                        }`}
                      >
                        <span
                          class={`h-1.5 w-1.5 rounded-full ${
                            row.statusId === 1
                              ? "bg-emerald-400"
                              : row.statusId === 2
                                ? "bg-amber-400"
                                : "bg-red-400"
                          }`}
                        />
                        {row.statusId != null
                          ? REVIEW_STATUSES[row.statusId] ?? `#${row.statusId}`
                          : "Unknown"}
                      </span>
                    </td>
                    <td class="border-b border-white/[0.06] px-6 py-4 text-sm text-zinc-400">
                      {row.createdAt
                        ? dateFormatter.format(new Date(row.createdAt))
                        : "Date unknown"}
                    </td>
                  </tr>
                );
              })}

              {endIndex < totalRows && (
                <tr aria-hidden="true">
                  <td
                    colSpan={6}
                    style={{
                      height: `${(totalRows - endIndex) * ROW_HEIGHT}px`,
                      padding: 0,
                    }}
                  />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalRows === 0 && (
          <div class="px-6 py-16 text-center text-sm text-zinc-500">
            No reviews found.
          </div>
        )}
      </div>
    );
  },
);
