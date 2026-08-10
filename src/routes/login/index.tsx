import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import type { Session } from "@auth/qwik";

export const onGet: RequestHandler = (event) => {
  const session = event.sharedMap.get("session") as Session | null;
  if (session && new Date(session.expires) > new Date()) {
    const callbackUrl = event.url.searchParams.get("callbackUrl") || "/";
    throw event.redirect(302, callbackUrl);
  }
};

export default component$(() => {
  const loc = useLocation();
  const error = loc.url.searchParams.get("error");
  const callbackUrl = loc.url.searchParams.get("callbackUrl") || "/";

  return (
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09070f] px-4 text-white">
      <div class="pointer-events-none absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-violet-700/20 blur-[130px]" />
      <div class="pointer-events-none absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div class="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-10">
        <div class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_28px_rgba(139,92,246,0.35)]">
            <svg
              viewBox="0 0 24 24"
              class="h-6 w-6"
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
            <span class="block text-base font-semibold tracking-wide">
              Review Control
            </span>
            <span class="block text-[10px] font-medium tracking-[0.18em] text-violet-300/70 uppercase">
              Impecca
            </span>
          </span>
        </div>

        <h1 class="mt-8 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p class="mt-1.5 text-sm text-zinc-400">
          Enter your password to access the review dashboard.
        </p>

        <form method="post" action="/auth/callback/credentials" class="mt-8">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label class="block">
            <span class="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Password
            </span>
            <input
              type="password"
              name="password"
              required
              autofocus
              autocomplete="current-password"
              class="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0c0912] px-4 text-sm text-white transition outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
              placeholder="••••••••••••"
            />
          </label>

          {error && (
            <p class="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
              Invalid password. Please try again.
            </p>
          )}

          <button
            type="submit"
            class="mt-6 h-12 w-full rounded-xl bg-violet-500 text-sm font-semibold text-white transition hover:bg-violet-400 focus:ring-2 focus:ring-violet-400/40 focus:outline-none"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Sign in | Review Control",
};
