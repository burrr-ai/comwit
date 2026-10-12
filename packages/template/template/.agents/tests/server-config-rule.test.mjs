import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '../..');
const binary = join(dirname(require.resolve('oxlint/package.json')), 'bin/oxlint');

function lint(t, source, path = 'src/server/config.ts') {
  const directory = mkdtempSync(join(tmpdir(), 'comwit config lint '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const config = join(directory, 'oxlint.json');
  const file = join(directory, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(config, JSON.stringify({
    categories: { correctness: 'off' },
    jsPlugins: [{ name: 'custom', specifier: join(root, 'eslint-rules/index.cjs') }],
    rules: { 'custom/server-config-getters': 'error' },
  }));
  writeFileSync(file, source);
  const result = spawnSync(process.execPath, [binary, '--config', config, '--format', 'json', file], { encoding: 'utf8', cwd: root });
  assert.ok(result.status === 0 || result.status === 1, result.stderr);
  const diagnostics = JSON.parse(result.stdout).diagnostics;
  assert.ok(diagnostics.every(item => item.code?.includes('server-config-getters')), result.stdout);
  return diagnostics;
}

test('accepts getters with env reads, derived values and constants through TypeScript wrappers', t => {
  assert.deepEqual(lint(t, `export const config = {
    get APP_NAME() { return process.env.APP_NAME; },
    get SITE_URL() { const app = process['env'].APP_NAME; return app ? 'https://' + app : undefined; },
    get APP_AUTH_SECRET() { return 'fixture-secret'; },
  } as const satisfies Record<string, string | undefined>;`), []);
});

test('rejects eager env values including derived and computed properties', t => {
  const errors = lint(t, `export const config = {
    TOKEN: process.env.API_TOKEN,
    ['SITE_URL']: process['env'].APP_NAME ? 'url' : undefined,
  } as const;`);
  assert.equal(errors.filter(error => error.message.includes('must be a getter')).length, 2);
  assert.equal(errors.filter(error => error.message.includes('Read process.env inside')).length, 2);
});

test('rejects plain values, methods, arrow functions, setters, shorthand and spreads', t => {
  const errors = lint(t, `const copied = {}; const NAME = 'name';
  export const config = {
    STATIC: 'value', method() { return 'value'; }, fn: () => 'value',
    set TOKEN(value) {}, NAME, ...copied,
  };`);
  assert.equal(errors.length, 6);
  assert.ok(errors.every(error => error.message.includes('must be a getter')));
});

test('rejects a snapshot hidden behind a getter', t => {
  const errors = lint(t, `const env = process.env;
    const { APP_NAME } = process['env'];
    export const config = { get TOKEN() { return env.API_TOKEN; }, get APP_NAME() { return APP_NAME; } };`);
  assert.equal(errors.length, 2);
  assert.ok(errors.every(error => error.message.includes('Read process.env inside')));
});

test('requires a directly inspectable config object', t => {
  const errors = lint(t, 'const values = {}; export const config = values;');
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /object literal with getters/);
});

test('does not apply to Next.js proxy config or standalone agent and Drizzle scripts', t => {
  for (const path of ['src/proxy.ts', '.agents/scripts/cleanup-skill.mjs', 'drizzle.config.ts']) {
    assert.deepEqual(lint(t, 'export const config = { value: process.env.VALUE };', path), []);
  }
});
