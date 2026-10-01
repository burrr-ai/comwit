#!/usr/bin/env node
// One-time skills remove themselves after they finish. A skill lives in
// `.agents/skills/<name>/` (the only copy) plus a `.claude/skills/<name>/`
// stub that points at it; both go together so no runtime keeps a stale entry.
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const allowedSkills = new Set(["app-setup", "auth-setup"]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function findWorkspaceRoot(startPath) {
  let current = path.resolve(startPath);
  while (true) {
    if (existsSync(path.join(current, ".agents"))) return current;
    const parent = path.dirname(current);
    if (parent === current) fail("Could not find a workspace containing .agents/");
    current = parent;
  }
}

const [, , skill] = process.argv;
if (!allowedSkills.has(skill)) {
  fail(`cleanup-skill only accepts: ${[...allowedSkills].join(", ")}`);
}

const workspaceRoot = findWorkspaceRoot(process.cwd());
const targets = [".agents/skills", ".claude/skills"].map((base) => path.join(workspaceRoot, base, skill));
if (!existsSync(targets[0])) fail(`Skill is not installed: ${skill}`);
for (const target of targets) rmSync(target, { recursive: true, force: true });
console.log(`SKILL_ENTRYPOINTS_REMOVED ${skill}`);
