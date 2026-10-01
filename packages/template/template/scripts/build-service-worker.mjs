import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = join(import.meta.dirname, "..");
const versionPayload = JSON.parse(
  readFileSync(join(rootDir, "public", "version.json"), "utf8"),
);
const appVersion =
  typeof versionPayload.version === "string" && versionPayload.version.trim()
    ? versionPayload.version.trim()
    : "local";

await build({
  entryPoints: [join(rootDir, "src", "app", "sw.ts")],
  outfile: join(rootDir, "public", "sw.js"),
  bundle: true,
  minify: true,
  legalComments: "none",
  format: "iife",
  platform: "browser",
  target: ["chrome96", "firefox102", "safari15.4"],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

console.log(`built public/sw.js with Serwist (${appVersion})`);
