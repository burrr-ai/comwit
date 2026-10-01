import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const binary = join(dirname(require.resolve("oxlint/package.json")), "bin/oxlint");
const configs = ["ts", "mts", "cts", "js", "mjs", "cjs"]
  .map((extension) => `drizzle.config.${extension}`).filter(existsSync);
const result = spawnSync(process.execPath, [binary, "src", ...configs], { stdio: "inherit" });
process.exitCode = result.status ?? 1;
