import type { RequestEventCommon } from "@builder.io/qwik-city";
import { QwikAuth$ } from "@auth/qwik";
import Credentials from "@auth/qwik/providers/credentials";

const DEFAULT_PASSWORD = "myReviews102938!";

const auth = QwikAuth$(() => ({
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const password = process.env.AUTH_PASSWORD ?? DEFAULT_PASSWORD;
        if (credentials?.password === password) {
          return {
            id: "admin",
            name: "Admin",
            email: "admin@impecca.local",
          };
        }
        return null;
      },
    }),
  ],
}));

const allowedIps = (process.env.AUTH_IP_CSV ?? "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

async function onRequestGuard(req: RequestEventCommon) {
  if (allowedIps.length > 0) {
    const ip = req.clientConn.ip ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (!ip || !allowedIps.includes(ip)) {
      throw req.error(403, "Forbidden: your IP is not allowed");
    }
  }
  await auth.onRequest(req);
}

export const { useSession, useSignIn, useSignOut, onRequest } = { ...auth, onRequest: onRequestGuard };
