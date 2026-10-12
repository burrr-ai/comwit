import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../../src/server/config.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
});

function loadConfig(env = {}) {
  const exports = {};
  runInNewContext(outputText, {
    exports,
    process: { env },
    require(name) {
      assert.equal(name, 'server-only');
      return {};
    },
  });
  return { env, ...exports };
}

test('server settings observe late injection, rotation and removal without reimporting', () => {
  const { env, config, requireServerConfig } = loadConfig();
  assert.equal(config.SITE_URL, undefined);
  env.SITE_URL = 'https://first.example.com';
  assert.equal(config.SITE_URL, 'https://first.example.com');
  assert.equal(requireServerConfig('SITE_URL'), 'https://first.example.com');
  env.SITE_URL = 'https://second.example.com';
  assert.equal(config.SITE_URL, 'https://second.example.com');
  delete env.SITE_URL;
  assert.equal(config.SITE_URL, undefined);
  assert.throws(() => requireServerConfig('SITE_URL'), {
    message: 'Required server configuration is missing: SITE_URL',
  });
});

test('NODE_ENV falls back to production and is recalculated on access', () => {
  const { env, config } = loadConfig();
  assert.equal(config.NODE_ENV, 'production');
  env.NODE_ENV = 'development';
  assert.equal(config.NODE_ENV, 'development');
  delete env.NODE_ENV;
  assert.equal(config.NODE_ENV, 'production');
});

test('required settings reject blank values without exposing them', () => {
  const { env, requireServerConfig } = loadConfig({ SITE_URL: 'https://example.com' });
  assert.equal(requireServerConfig('SITE_URL'), 'https://example.com');
  env.SITE_URL = '  ';
  assert.throws(() => requireServerConfig('SITE_URL'), {
    message: 'Required server configuration is missing: SITE_URL',
  });
});
