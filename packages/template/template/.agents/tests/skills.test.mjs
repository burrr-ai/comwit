import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function frontmatter(file) {
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  assert.ok(match, `${path.relative(root, file)} needs YAML frontmatter`);
  return { head: match[1].trim(), body: match[2] };
}

function skills(base) {
  const directory = path.join(root, base);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => skillName.test(name) && fs.statSync(path.join(directory, name)).isDirectory()).sort();
}

// Codex and Antigravity read `.agents/skills/` directly; Claude Code reads only
// `.claude/skills/`. Each Claude stub must carry the same frontmatter and point at
// the canonical file, so the two directories can never drift apart silently.
test("every .agents skill has a matching .claude stub, and nothing else lives in .claude/skills", () => {
  const canonical = skills(".agents/skills");
  assert.deepEqual(skills(".claude/skills"), canonical);
  for (const name of canonical) {
    const source = frontmatter(path.join(root, ".agents/skills", name, "SKILL.md"));
    const stub = frontmatter(path.join(root, ".claude/skills", name, "SKILL.md"));
    assert.equal(stub.head, source.head, `frontmatter differs for ${name}`);
    assert.match(stub.body, new RegExp(`\`\\.agents/skills/${name}/SKILL\\.md\``), `stub for ${name} must point at the canonical file`);
    assert.ok(stub.body.trim().split("\n").length <= 3, `stub for ${name} must stay a pointer, not a copy`);
    assert.equal(fs.readdirSync(path.join(root, ".claude/skills", name)).join(), "SKILL.md", `stub directory for ${name} must contain only SKILL.md`);
  }
});

test("skill text and helper scripts reference .agents paths only", () => {
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) { if (file !== path.join(root, ".agents/tests")) walk(file); }
      else if (/\.(md|mjs|sh|yaml)$/.test(entry.name)) files.push(file);
    }
  };
  for (const base of [".agents", ".claude/skills"]) if (fs.existsSync(path.join(root, base))) walk(path.join(root, base));
  files.push(path.join(root, "AGENTS.md"));
  for (const file of files) {
    assert.equal(fs.readFileSync(file, "utf8").includes(".comwit/"), false, `${path.relative(root, file)} still references .comwit/`);
  }
});
