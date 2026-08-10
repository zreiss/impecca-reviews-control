import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$ } from "@builder.io/qwik-city";

import { createReview } from "~/lib/db/queries";
import { SiteHeader } from "~/components/site-header";

function nowDatetimeLocal(): string {
  const value = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export const useSku = routeLoader$(({ params, query }) => {
  const entityPkValue = Number(query.get("entityPkValue") ?? "");
  return {
    sku: String(params.sku),
    entityPkValue:
      Number.isInteger(entityPkValue) && entityPkValue > 0
        ? entityPkValue
        : undefined,
  };
});

export const useCreateReviewAction = routeAction$(async (form) => {
  const echo = {
    reviewer: String(form.reviewer ?? ""),
    title: String(form.title ?? ""),
    detail: String(form.detail ?? ""),
    rating: String(form.rating ?? ""),
    createdAt: String(form.createdAt ?? ""),
  };

  const sku = String(form.sku ?? "").trim();
  const rating = Number(form.rating);
  const createdAt = form.createdAt ? new Date(String(form.createdAt)) : null;
  const entityPkValue = Number(form.entityPkValue ?? "");
  const parsedEntityPkValue =
    Number.isInteger(entityPkValue) && entityPkValue > 0
      ? entityPkValue
      : undefined;

  if (!sku) {
    return { ...echo, error: "Missing SKU." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ...echo, error: "Rating must be a whole number from 1 to 5." };
  }
  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return { ...echo, error: "Invalid created date." };
  }

  try {
    const result = await createReview({
      sku,
      entityPkValue: parsedEntityPkValue,
      reviewer: echo.reviewer.trim(),
      title: echo.title.trim(),
      detail: echo.detail.trim(),
      rating,
      createdAt,
    });
    return { ...echo, reviewId: result.reviewId };
  } catch (error) {
    return {
      ...echo,
      error:
        error instanceof Error ? error.message : "Failed to create review.",
    };
  }
});

export default component$(() => {
  const skuData = useSku();
  const { sku, entityPkValue } = skuData.value;
  const createAction = useCreateReviewAction();
  const submitting = useSignal(false);

  const submitted = createAction.value;
  const reviewer = submitted?.reviewer ?? "";
  const title = submitted?.title ?? "";
  const detail = submitted?.detail ?? "";
  const rating = submitted?.rating ?? "";
  const createdAt = submitted?.createdAt ?? nowDatetimeLocal();

  return (
    <main class="relative min-h-screen overflow-hidden bg-[#09070f] text-white">
      <div class="pointer-events-none absolute -top-52 left-1/3 h-[34rem] w-[34rem] rounded-full bg-violet-700/20 blur-[130px]" />
      <div class="pointer-events-none absolute top-1/3 -right-56 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div class="relative mx-auto w-full max-w-[1080px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <SiteHeader>
          <a
            q:slot="actions"
            href={`/product/${encodeURIComponent(sku)}`}
            class="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
          >
            Back to product
          </a>
        </SiteHeader>

        <section class="pt-10 pb-7 lg:pt-14 lg:pb-9">
          <div class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300 uppercase">
            <span class="h-px w-7 bg-violet-400" />
            New review
          </div>
          <h1 class="font-mono text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Add review for {sku}
          </h1>
          <p class="mt-3 text-sm text-zinc-400">
            Created as Approved on the product's site.
          </p>
        </section>

        <section class="overflow-hidden rounded-2xl border border-white/10 bg-[#100d18]/90 shadow-2xl shadow-black/30">
          {submitted?.error && (
            <div class="border-b border-red-400/20 bg-red-500/10 px-6 py-3 text-sm text-red-300 sm:px-9">
              {submitted.error}
            </div>
          )}
          {submitted?.reviewId && (
            <div class="border-b border-emerald-400/20 bg-emerald-500/10 px-6 py-3 text-sm text-emerald-300 sm:px-9">
              Review #{submitted.reviewId} created.{" "}
              <a
                href={`/review/${submitted.reviewId}`}
                class="font-semibold underline decoration-emerald-400/40 underline-offset-2 hover:text-emerald-200"
              >
                View it
              </a>
            </div>
          )}
          <Form
            action={createAction}
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
            <input type="hidden" name="sku" value={sku} />
            {entityPkValue && (
              <input type="hidden" name="entityPkValue" value={entityPkValue} />
            )}
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
                    Rating (1–5)
                  </span>
                  <input
                    type="number"
                    name="rating"
                    min="1"
                    max="5"
                    step="1"
                    value={rating}
                    class="h-11 w-full rounded-xl border border-white/10 bg-[#0c0912] px-4 font-mono text-sm text-white transition outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
                  />
                </label>
              </div>

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
                Inserts one review, its detail, and a Quality rating in a
                single transaction.
              </p>
              <div class="flex items-center gap-3">
                <a
                  href={`/product/${encodeURIComponent(sku)}`}
                  class="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  disabled={submitting.value}
                  class="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 focus:ring-2 focus:ring-violet-400/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create review
                </button>
              </div>
            </div>
          </Form>
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
  title: "Review Control | New Review",
  meta: [
    {
      name: "description",
      content: "Create a new Magento customer review.",
    },
  ],
};
