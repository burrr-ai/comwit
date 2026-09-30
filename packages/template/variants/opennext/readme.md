## Deploy — Cloudflare Workers via OpenNext

Scaffolded with `--opennext`. `pnpm run preview` builds the Worker and runs it
locally in workerd; `pnpm run deploy` publishes it (`wrangler login` once).
`wrangler.jsonc` names the Worker and holds runtime `vars`; secrets go through
`wrangler secret put`; `.dev.vars` (gitignored) feeds the local preview.
