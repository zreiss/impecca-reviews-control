import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$ } from "@builder.io/qwik-city";

import { getReviewById, saveReview } from "~/lib/db/queries";

export const REVIEW_STATUSES = [
  { id: 1, label: "Approved" },
  { id: 2, label: "Pending" },
  { id: 3, label: "Not Approved" },
] as const;

function toDatetimeLocal(value: Date | null): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export const useReview = routeLoader$(async ({ params, status }) => {
  const review = await getReviewById(params.id);
  if (!review) {
    status(404);
  }
  return review
    ? { ...review, createdAtInput: toDatetimeLocal(review.createdAt) }
    : review;
});

export const useSaveReviewAction = routeAction$(async (form) => {
  const echo = {
    reviewer: String(form.reviewer ?? ""),
    title: String(form.title ?? ""),
    detail: String(form.detail ?? ""),
    rating: String(form.rating ?? ""),
    status: String(form.status ?? ""),
    createdAt: String(form.createdAt ?? ""),
  };

  const reviewId = Number(form.reviewId);
  const rating = Number(form.rating);
  const statusId = Number(form.status);
  const createdAt = form.createdAt ? new Date(String(form.createdAt)) : null;

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return { ...echo, error: "Missing review id." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ...echo, error: "Rating must be a whole number from 1 to 5." };
  }
  if (!REVIEW_STATUSES.some((item) => item.id === statusId)) {
    return { ...echo, error: "Invalid status." };
  }
  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return { ...echo, error: "Invalid created date." };
  }

  try {
    const result = await saveReview(reviewId, {
      reviewer: echo.reviewer.trim(),
      title: echo.title.trim(),
      detail: echo.detail.trim(),
      rating,
      statusId,
      createdAt,
    });
    return { ...echo, reviewId: result.reviewId };
  } catch (error) {
    return {
      ...echo,
      error:
        error instanceof Error ? error.message : "Failed to save review.",
    };
  }
});

export default component$(() => {
  const reviewData = useReview();
  const review = reviewData.value;
  const saveAction = useSaveReviewAction();
  const submitting = useSignal(false);

  const submitted = saveAction.value;
  const reviewer = submitted?.reviewer ?? review?.reviewer ?? "";
  const title = submitted?.title ?? review?.title ?? "";
  const detail = submitted?.detail ?? review?.detail ?? "";
  const rating = submitted?.rating ?? review?.rating ?? "";
  const status = submitted?.status ?? String(review?.statusId ?? "");
  const createdAt = submitted?.createdAt ?? review?.createdAtInput ?? "";

  return (
    <main class="relative min-h-screen overflow-hidden bg-[#09070f] text-white">
      <div class="pointer-events-none absolute -top-52 left-1/3 h-[34rem] w-[34rem] rounded-full bg-violet-700/20 blur-[130px]" />
      <div class="pointer-events-none absolute top-1/3 -right-56 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div class="relative mx-auto w-full max-w-[1080px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header class="flex items-center justify-between border-b border-white/10 pb-5">
          <a
            href="/"
            class="flex items-center gap-3"
            aria-label="Review Control home"
          >
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_28px_rgba(139,92,246,0.35)]">
              <svg
                viewBox="0 0 24 24"
                class="h-5 w-5"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 5.5h14v10H9l-4 3v-13Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linejoin="round"
                />
                <path
                  d="m9.2 10.4 1.7 1.7 3.9-4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span>
              <span class="block text-sm font-semibold tracking-wide">
                Review Control
              </span>
              <span class="block text-[10px] font-medium tracking-[0.18em] text-violet-300/70 uppercase">
                Impecca
              </span>
            </span>
          </a>

          <a
            href={`/review/${review?.reviewId}`}
            class="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
          >
            Back to review
          </a>
        </header>

        <section class="pt-10 pb-7 lg:pt-14 lg:pb-9">
          <div class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300 uppercase">
            <span class="h-px w-7 bg-violet-400" />
            Edit review
          </div>
          <h1 class="font-mono text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Review #{review?.reviewId}
          </h1>
          <p class="mt-3 text-sm text-zinc-400">
            {review?.sku ? `Product ${review.sku}` : "Product unknown"}
          </p>
        </section>

        {review === null ? (
          <section class="rounded-2xl border border-white/10 bg-[#100d18]/90 px-6 py-16 text-center text-sm text-zinc-500 shadow-2xl shadow-black/30">
            Review not found.
          </section>
        ) : (
          <section class="overflow-hidden rounded-2xl border border-white/10 bg-[#100d18]/90 shadow-2xl shadow-black/30">
            {saveAction.value?.error && (
              <div class="border-b border-red-400/20 bg-red-500/10 px-6 py-3 text-sm text-red-300 sm:px-9">
                {saveAction.value.error}
              </div>
            )}
            {saveAction.value?.reviewId && (
              <div class="border-b border-emerald-400/20 bg-emerald-500/10 px-6 py-3 text-sm text-emerald-300 sm:px-9">
                Review #{saveAction.value.reviewId} saved to the database.
              </div>
            )}
            <Form
              action={saveAction}
              onSubmit$={() => {
                submitting.value = true;
              }}
              onKeyDown$={(event: KeyboardEvent) => {
                const target = event.target as HTMLElement;
                if (event.key === "Enter" && target.tagName === "INPUT") {
                  event.preventDefault();
                }
              }}
              class="divide-y divide-white/[0.07]"
            >
              <input type="hidden" name="reviewId" value={review?.reviewId ?? ""} />
              <div class="space-y-6 px-6 py-7 sm:px-9">
                <div class="grid gap-6 sm:grid-cols-2">
                  <label class="block">
                    <span class="mb-1.5 block text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                      Reviewer
                    </span>
                    <input
                      type="text"
                      name="reviewer"
                      value={reviewer}
                      class="h-11 w-full rounded-xl border border-white/10 bg-[#0c0912] px-4 text-sm text-white transition outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
                    />
                  </label>
                  <label class="block">
                    <span class="mb-1.5 block text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                      Rating (0–5)
                    </span>
                    <input
                      type="number"
                      name="rating"
                      min="0"
                      max="5"
                      step="0.1"
                      value={rating}
                      class="h-11 w-full rounded-xl border border-white/10 bg-[#0c0912] px-4 font-mono text-sm text-white transition outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
                    />
                  </label>
                </div>

                <div class="grid gap-6 sm:grid-cols-2">
                  <label class="block">
                    <span class="mb-1.5 block text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                      Status
                    </span>
                    <select
                      name="status"
                      value={status}
                      class="h-11 w-full rounded-xl border border-white/10 bg-[#0c0912] px-3 text-sm text-white transition outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
                    >
                      <option value="" disabled>
                        Select status
                      </option>
                      {REVIEW_STATUSES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label class="block">
                    <span class="mb-1.5 block text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                      Created
                    </span>
                    <input
                      type="datetime-local"
                      name="createdAt"
                      value={createdAt}
                      class="h-11 w-full rounded-xl border border-white/10 bg-[#0c0912] px-4 font-mono text-sm text-white transition outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
                    />
                  </label>
                </div>

                <label class="block">
                  <span class="mb-1.5 block text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                    Title
                  </span>
                  <input
                    type="text"
                    name="title"
                    value={title}
                    class="h-11 w-full rounded-xl border border-white/10 bg-[#0c0912] px-4 text-sm text-white transition outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
                  />
                </label>

                <label class="block">
                  <span class="mb-1.5 block text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                    Review detail
                  </span>
                  <textarea
                    name="detail"
                    rows={6}
                    class="w-full resize-y rounded-xl border border-white/10 bg-[#0c0912] px-4 py-3 text-sm leading-6 text-white transition outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
                  >
                    {detail}
                  </textarea>
                </label>
              </div>

              <div class="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-9">
                <p class="text-xs text-zinc-500">
                  Saves directly to the Magento database in a single
                  transaction — updates the review, its detail, and the rating.
                </p>
                <div class="flex items-center gap-3">
                  <a
                    href={`/review/${review.reviewId}`}
                    class="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    Cancel
                  </a>
                  <button
                    type="submit"
                    disabled={submitting.value}
                    class="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 focus:ring-2 focus:ring-violet-400/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save review
                  </button>
                </div>
              </div>
            </Form>
          </section>
        )}

        <footer class="flex items-center justify-between py-6 text-[11px] text-zinc-600">
          <span>Impecca Review Control</span>
          <span>Magento review data</span>
        </footer>
      </div>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Review Control | Edit Review",
  meta: [
    {
      name: "description",
      content: "Edit a Magento customer review.",
    },
  ],
};
