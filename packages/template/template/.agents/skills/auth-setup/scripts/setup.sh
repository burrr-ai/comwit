#!/bin/bash
# auth-setup helper — handles ONLY the mechanical shell work.
# Everything that involves editing existing TS files (schema.ts exports,
# config.ts secret insertion, adapting mock files, substituting placeholders
# in .ref templates, etc.) is handled by the AI following SKILL.md.
#
# Usage: bash setup.sh <service1> [service2] ...
# Example: bash setup.sh app admin

set -euo pipefail

CHECK_DEPENDENCIES_ONLY=false
if [ "${1:-}" = "--check-dependencies" ]; then
  CHECK_DEPENDENCIES_ONLY=true
  shift
fi

if [ $# -eq 0 ] && [ "$CHECK_DEPENDENCIES_ONLY" = false ]; then
  echo "Usage: $0 <service1> [service2] ..."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../../../.."

node - "$PROJECT_ROOT" <<'NODE'
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')

const projectRoot = path.resolve(process.argv[2])
const packagePath = path.join(projectRoot, 'package.json')
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const declared = { ...pkg.dependencies, ...pkg.devDependencies }
const requireFromProject = createRequire(packagePath)
const requirements = ['better-auth', 'drizzle-orm']
const missing = requirements.filter((name) => {
  if (!declared[name]) return true
  try {
    requireFromProject.resolve(name)
    return false
  } catch {
    return true
  }
})

if (missing.length > 0) {
  console.error(`required auth packages are missing or not installed: ${missing.join(', ')}. Run: pnpm add better-auth drizzle-orm`)
  process.exit(1)
}
console.log('Auth packages verified; nothing was installed.')
NODE

if [ "$CHECK_DEPENDENCIES_ONLY" = true ]; then
  exit 0
fi

for SERVICE in "$@"; do
  echo "=== $SERVICE ==="

  # 1. Create required directories (idempotent)
  mkdir -p "$PROJECT_ROOT/src/server/auth"
  mkdir -p "$PROJECT_ROOT/src/server/db/plugin/auth"
  mkdir -p "$PROJECT_ROOT/src/lib/auth-client"
  mkdir -p "$PROJECT_ROOT/src/app/(${SERVICE})/${SERVICE}/api/auth/[...all]"

  # 2. Generate a secret for the service (AI inserts it into config.ts)
  SECRET="$(openssl rand -hex 32)"
  echo "  secret: ${SECRET}"

  echo "  directories ready; AI handles file content per SKILL.md"
  echo ""
done

echo "=== done ==="
