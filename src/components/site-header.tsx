import { component$, Slot } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/reviews", label: "All reviews" },
] as const;

export const SiteHeader = component$(() => {
  const location = useLocation();
  const pathname = location.url.pathname;

  return (
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
      <div class="flex items-center gap-5">
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

        <nav class="flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                class={
                  active
                    ? "rounded-lg border border-violet-400/30 bg-violet-400/15 px-3 py-1.5 text-xs font-medium text-violet-200"
                    : "rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-white/10 hover:text-zinc-300"
                }
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      <div class="flex items-center gap-2">
        <Slot name="actions" />
      </div>
    </header>
  );
});
