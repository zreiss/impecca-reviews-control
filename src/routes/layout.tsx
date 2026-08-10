import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import type { Session } from "@auth/qwik";

export const onRequest: RequestHandler = (event) => {
  const pathname = event.url.pathname;

  if (
    pathname === "/login" ||
    pathname === "/login/" ||
    pathname.startsWith("/auth/")
  )
    return;

  const session = event.sharedMap.get("session") as Session | null;
  if (!session || new Date(session.expires) < new Date()) {
    const callbackUrl = encodeURIComponent(pathname + event.url.search);
    throw event.redirect(302, `/login?callbackUrl=${callbackUrl}`);
  }
};

export default component$(() => {
  return <Slot />;
});
