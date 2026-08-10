import { vercelEdgeAdapter } from "@builder.io/qwik-city/adapters/vercel-edge/vite";
import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.vercel-edge.tsx", "@qwik-city-plan"],
      },
      outDir: ".vercel/output/functions/_qwik-city.func",
    },
    plugins: [
      // target: "node" builds the function for the Node.js runtime so mysql2 and
      // process.env work on Vercel. The .vc-config.json runtime is patched to
      // "nodejs20.x" by adapters/vercel-edge/patch-runtime.mjs after the build.
      vercelEdgeAdapter({ target: "node" }),
    ],
  };
});
