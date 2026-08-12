import {
  component$,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import type { ProductReviewRow } from "~/lib/db/queries";
import { getSite, siteSearchUrl } from "~/lib/sites";

const DEFAULT_ROW_HEIGHT = 88;
const OVERSCAN = 4;

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
  page?: number;
  initialScrollTop?: number | null;
};

export const ReviewVirtualList = component$<ReviewVirtualListProps>(
  ({ rows, page, initialScrollTop }) => {
    const scrollTop = useSignal(0);
    const viewportHeight = useSignal(640);
    const scrollRef = useSignal<HTMLElement | undefined>(undefined);
    const measured = useStore<Record<number, number>>({});
    const reviewerFilter = useSignal<string | null>(null);
    const highlightId = useSignal<number | null>(null);
    const nav = useNavigate();

    const filteredRows =
      reviewerFilter.value == null
        ? rows
        : [...rows]
            .filter((row) => (row.reviewer ?? "Anonymous") === reviewerFilter.value)
            .sort((a, b) => {
              const ta = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
              const tb = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
              return tb - ta;
            });

    const reviewerCounts = new Map<string, number>();
    for (const row of rows) {
      const name = row.reviewer ?? "Anonymous";
      reviewerCounts.set(name, (reviewerCounts.get(name) ?? 0) + 1);
    }

    const backHref = page && page > 1 ? `/reviews/?page=${page}` : "/reviews/";

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

    useVisibleTask$(() => {
      const element = scrollRef.value;
      if (!element) return;

      const hashMatch = window.location.hash.match(/^#review-(\d+)$/);
      const targetId = hashMatch ? Number(hashMatch[1]) : null;
      const index =
        targetId != null
          ? rows.findIndex((row) => row.reviewId === targetId)
          : -1;

      let offset: number | null = null;
      if (index >= 0) {
        offset = 0;
        for (let i = 0; i < index; i++) {
          offset += measured[i] ?? DEFAULT_ROW_HEIGHT;
        }
      } else if (initialScrollTop != null) {
        offset = initialScrollTop;
      }
      if (offset != null) {
        element.scrollTop = offset;
      }

      if (targetId == null || index < 0) return;

      // Wait for the row to render (scroll restore triggers the window to
      // shift), then center it inside the container.
      let attempts = 0;
      const center = () => {
        attempts += 1;
        if (attempts > 120) return; // give up; approximate scroll is close enough
        const rowEl = element.querySelector(`tr[id="review-${targetId}"]`);
        if (!rowEl) {
          requestAnimationFrame(center);
          return;
        }
        const rect = rowEl.getBoundingClientRect();
        const contRect = element.getBoundingClientRect();
        const rowCenter = rect.top - contRect.top + rect.height / 2;
        element.scrollTop = Math.max(
          0,
          element.scrollTop + rowCenter - element.clientHeight / 2,
        );
        highlightId.value = targetId;
      };
      requestAnimationFrame(center);
    });

    useTask$(({ track, cleanup }) => {
      track(() => scrollTop.value);
      track(() => viewportHeight.value);
      const element = scrollRef.value;
      if (!element || typeof ResizeObserver === "undefined") return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index);
          const height = entry.borderBoxSize[0]?.blockSize ?? 0;
          if (
            Number.isInteger(index) &&
            index >= 0 &&
            height > 0 &&
            measured[index] !== height
          ) {
            measured[index] = height;
          }
        }
      });
      element
        .querySelectorAll<HTMLElement>("tr[data-index]")
        .forEach((row) => observer.observe(row));
      cleanup(() => observer.disconnect());
    });

    const totalRows = filteredRows.length;
    const offsets = new Array<number>(totalRows + 1);
    offsets[0] = 0;
    for (let i = 0; i < totalRows; i++) {
      offsets[i + 1] = offsets[i] + (measured[i] ?? DEFAULT_ROW_HEIGHT);
    }

    let startIndex = 0;
    let lo = 0;
    let hi = totalRows;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (offsets[mid] <= scrollTop.value) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    startIndex = Math.max(0, lo - OVERSCAN);

    let endIndex = startIndex;
    const scrollBottom = scrollTop.value + viewportHeight.value;
    const overscanPx = OVERSCAN * DEFAULT_ROW_HEIGHT;
    while (
      endIndex < totalRows &&
      offsets[endIndex] - offsets[startIndex] <
        scrollBottom - scrollTop.value + overscanPx
    ) {
      endIndex++;
    }
    endIndex = Math.min(totalRows, endIndex + OVERSCAN);

    const visibleRows = filteredRows.slice(startIndex, endIndex);

    return (
      <div class="overflow-hidden rounded-2xl border border-white/10 bg-[#100d18]/90 shadow-2xl shadow-black/30">
        {reviewerFilter.value != null && (
          <div class="flex items-center gap-3 border-b border-white/10 bg-[#141120] px-4 py-2.5">
            <span class="text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
              Reviewer
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 py-1 pr-1 pl-3 text-xs font-medium text-violet-200">
              {reviewerFilter.value}
              <button
                type="button"
                onClick$={() => {
                  reviewerFilter.value = null;
                  scrollTop.value = 0;
                }}
                aria-label="Clear reviewer filter"
                class="grid h-5 w-5 place-items-center rounded-full text-violet-300 transition hover:bg-violet-400/20 hover:text-white"
              >
                <span aria-hidden="true">×</span>
              </button>
            </span>
            <span class="text-xs text-zinc-500">
              {filteredRows.length} review{filteredRows.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
        <div
          ref={scrollRef}
          onScroll$={(_, element) => {
            scrollTop.value = element.scrollTop;
          }}
          tabIndex={0}
          aria-label="Virtualized review list"
          class="h-[64vh] min-h-[360px] overflow-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
        >
          <table class="w-full min-w-[1040px] border-separate border-spacing-0 text-left">
            <thead class="sticky top-0 z-10">
              <tr class="bg-[#141120] text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                <th class="w-44 border-b border-white/10 px-4 py-4">
                  Product SKU
                </th>
                <th class="w-[40%] min-w-[360px] border-b border-white/10 px-6 py-4">
                  Review
                </th>
                <th class="w-40 border-b border-white/10 px-4 py-4">Reviewer</th>
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
                      height: `${offsets[startIndex]}px`,
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
                    id={`review-${row.reviewId}`}
                    data-index={rowIndex}
                    onClick$={(_, element) => {
                      const container = scrollRef.value;
                      const back = container
                        ? backHref +
                          (backHref.includes("?") ? "&" : "?") +
                          "pos=" +
                          Math.max(
                            0,
                            Math.round(
                              container.scrollTop +
                                (element.getBoundingClientRect().top -
                                  container.getBoundingClientRect().top),
                            ),
                          )
                        : backHref;
                      nav(
                        `/review/${row.reviewId}?back=${encodeURIComponent(back)}`,
                      );
                    }}
                    onKeyDown$={(event, element) => {
                      if (
                        event.target === element &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        const container = scrollRef.value;
                        const back = container
                          ? backHref +
                            (backHref.includes("?") ? "&" : "?") +
                            "pos=" +
                            Math.max(
                              0,
                              Math.round(
                                container.scrollTop +
                                  (element.getBoundingClientRect().top -
                                    container.getBoundingClientRect().top),
                              ),
                            )
                          : backHref;
                        nav(
                          `/review/${row.reviewId}?back=${encodeURIComponent(back)}`,
                        );
                      }
                    }}
                    role="link"
                    tabIndex={0}
                    class={`group cursor-pointer align-top outline-none transition-colors hover:bg-violet-400/[0.045] ${
                      row.reviewId === highlightId.value
                        ? "border-y border-violet-400/60 bg-violet-400/[0.12]"
                        : ""
                    }`}
                  >
                    <td class="border-b border-white/[0.06] px-4 py-4 align-top">
                      <div class="flex items-center gap-3">
                        {site ? (
                          <a
                            href={externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={`Open ${site.name} store`}
                            onClick$={(event) => event.stopPropagation()}
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
                            onClick$={(event) => event.stopPropagation()}
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
                    <td class="min-w-[360px] border-b border-white/[0.06] px-6 py-4 align-top">
                      {row.title && (
                        <p class="text-sm font-semibold text-zinc-100">
                          {row.title}
                        </p>
                      )}
                      {row.detail && (
                        <p class="mt-0.5 max-w-prose text-sm leading-6 whitespace-pre-line text-zinc-400">
                          {row.detail}
                        </p>
                      )}
                    </td>
                    <td class="border-b border-white/[0.06] px-4 py-4 align-top text-sm">
                      <span class="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick$={(event) => {
                            event.stopPropagation();
                            reviewerFilter.value = row.reviewer ?? "Anonymous";
                            scrollTop.value = 0;
                          }}
                          class="font-medium text-zinc-400 underline-offset-4 transition hover:text-violet-300 hover:underline"
                          title="Show all reviews by this reviewer"
                        >
                          {row.reviewer ?? "Anonymous"}
                        </button>
                        {reviewerFilter.value == null &&
                          (reviewerCounts.get(row.reviewer ?? "Anonymous") ?? 0) > 1 && (
                            <span
                              class="inline-flex min-w-6 items-center justify-center rounded-full border border-violet-400/30 bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300"
                              title={`${reviewerCounts.get(row.reviewer ?? "Anonymous")} reviews by this reviewer`}
                            >
                              {reviewerCounts.get(row.reviewer ?? "Anonymous")}
                            </span>
                          )}
                      </span>
                    </td>
                    <td class="border-b border-white/[0.06] px-4 py-4 align-top">
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
                    <td class="border-b border-white/[0.06] px-4 py-4 align-top">
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
                    <td class="border-b border-white/[0.06] px-6 py-4 align-top text-sm text-zinc-400">
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
                      height: `${offsets[totalRows] - offsets[endIndex]}px`,
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
            {reviewerFilter.value != null
              ? "No reviews by this reviewer found."
              : "No reviews found."}
          </div>
        )}
      </div>
    );
  },
);
