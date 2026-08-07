import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { ReviewSummaryRow } from "~/lib/db/queries";

const ROW_HEIGHT = 74;
const OVERSCAN = 6;

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type ReviewTableProps = {
  rows: ReviewSummaryRow[];
  subtitle?: string;
};

export const ReviewTable = component$<ReviewTableProps>(
  ({ rows, subtitle }) => {
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
        <div class="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <h2 class="text-sm font-semibold">Product review summary</h2>
            <p class="mt-1 text-xs text-zinc-500">
              {subtitle ?? "Current catalog performance"}
            </p>
          </div>
          <span class="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-violet-300 uppercase">
            {numberFormatter.format(totalRows)} records
          </span>
        </div>

        <div
          ref={scrollRef}
          onScroll$={(_, element) => {
            scrollTop.value = element.scrollTop;
          }}
          tabIndex={0}
          aria-label="Virtualized product review list"
          class="h-[64vh] min-h-[360px] overflow-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
        >
          <table class="w-full min-w-[720px] border-separate border-spacing-0 text-left">
            <thead class="sticky top-0 z-10">
              <tr class="bg-[#141120] text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                <th class="w-16 border-b border-white/10 px-6 py-4">No.</th>
                <th class="border-b border-white/10 px-4 py-4">Product SKU</th>
                <th class="w-24 border-b border-white/10 px-4 py-4">Reviews</th>
                <th class="w-[32%] border-b border-white/10 px-4 py-4">
                  Rating
                </th>
                <th class="w-44 border-b border-white/10 px-6 py-4">
                  Latest review
                </th>
              </tr>
            </thead>
            <tbody>
              {startIndex > 0 && (
                <tr aria-hidden="true">
                  <td
                    colSpan={5}
                    style={{
                      height: `${startIndex * ROW_HEIGHT}px`,
                      padding: 0,
                    }}
                  />
                </tr>
              )}

              {visibleRows.map((row, index) => {
                const rowIndex = startIndex + index;
                const rating = Math.min(
                  5,
                  Math.max(0, Number(row.ratingAverage)),
                );

                return (
                  <tr
                    key={`${row.sku}-${rowIndex}`}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    class="group transition-colors hover:bg-violet-400/[0.045]"
                  >
                    <td class="border-b border-white/[0.06] px-6 py-5 font-mono text-xs text-zinc-600">
                      {String(rowIndex + 1).padStart(2, "0")}
                    </td>
                    <td class="border-b border-white/[0.06] px-4 py-5">
                      <div class="flex items-center gap-3">
                        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-violet-300 transition group-hover:border-violet-400/30 group-hover:bg-violet-400/10">
                          <svg
                            viewBox="0 0 24 24"
                            class="h-4 w-4"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="m4.5 8 7.5-4 7.5 4-7.5 4-7.5-4Z"
                              stroke="currentColor"
                              stroke-width="1.5"
                              stroke-linejoin="round"
                            />
                            <path
                              d="m4.5 8v8l7.5 4 7.5-4V8M12 12v8"
                              stroke="currentColor"
                              stroke-width="1.5"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </span>
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
                    <td class="border-b border-white/[0.06] px-4 py-5">
                      <span class="inline-flex min-w-10 justify-center rounded-md bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-zinc-300">
                        {numberFormatter.format(row.reviewCount)}
                      </span>
                    </td>
                    <td class="border-b border-white/[0.06] px-4 py-5">
                      <div class="flex items-center gap-3">
                        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                          <div
                            class="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.35)]"
                            style={{ width: `${rating * 20}%` }}
                          />
                        </div>
                        <span class="w-11 text-right font-mono text-xs font-semibold text-violet-200">
                          {rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td class="border-b border-white/[0.06] px-6 py-5 text-sm text-zinc-400">
                      {row.mostRecentReviewAt
                        ? dateFormatter.format(new Date(row.mostRecentReviewAt))
                        : "No reviews yet"}
                    </td>
                  </tr>
                );
              })}

              {endIndex < totalRows && (
                <tr aria-hidden="true">
                  <td
                    colSpan={5}
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
            No products match these filters.
          </div>
        )}

        <div class="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p class="text-xs text-zinc-500">
            <span class="font-medium text-zinc-300">
              {numberFormatter.format(totalRows)}
            </span>{" "}
            product records in a virtualized list
          </p>
          <p class="text-xs text-zinc-500">Scroll to browse the full catalog</p>
        </div>
      </div>
    );
  },
);
