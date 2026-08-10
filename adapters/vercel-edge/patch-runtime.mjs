// Force the Qwik Vercel Edge adapter's generated function to run on the
// Node.js runtime. mysql2 (DB driver) and Auth.js need Node APIs, which are
// not available in Vercel Edge Functions.
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const funcDir = resolve(
  ".vercel/output/functions/_qwik-city.func",
);

const vcConfigPath = join(funcDir, ".vc-config.json");
const vcConfig = JSON.parse(await readFile(vcConfigPath, "utf8"));
vcConfig.runtime = "nodejs20.x";
if ("entrypoint" in vcConfig) {
  vcConfig.handler = vcConfig.entrypoint;
  delete vcConfig.entrypoint;
}
await writeFile(vcConfigPath, JSON.stringify(vcConfig, null, 2));
console.log(`Patched ${vcConfigPath}: runtime -> ${vcConfig.runtime}`);
