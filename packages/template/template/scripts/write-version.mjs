import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function resolveAppVersion() {
  const envVersion =
    process.env.NEXT_DEPLOYMENT_ID ||
    process.env.DEPLOYMENT_VERSION ||
    process.env.GIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA;

  if (envVersion?.trim()) return envVersion.trim();

  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "local";
  }
}

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = join(rootDir, "public", "version.json");
const version = resolveAppVersion();

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, `${JSON.stringify({ version }, null, 2)}\n`);

console.log(`wrote public/version.json (${version})`);
