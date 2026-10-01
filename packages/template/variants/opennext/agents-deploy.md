## Deploy

This project deploys to Cloudflare Workers through OpenNext
(`@opennextjs/cloudflare`). `wrangler.jsonc` names the Worker,
`open-next.config.ts` holds the adapter config.

```bash
pnpm run validate
pnpm run preview   # opennextjs-cloudflare build (runs pnpm run build) + local workerd
pnpm run deploy    # build + wrangler deploy (needs `wrangler login` once)
```

`next dev` keeps reading `.env`; the Worker reads `wrangler.jsonc` `vars` and
secrets set with `wrangler secret put`, and `.dev.vars` (gitignored) locally
for `pnpm run preview`. Set `SITE_URL` as a Worker variable. Incremental cache
(ISR/`revalidate`) needs a KV or R2 binding before the product relies on it;
see https://opennext.js.org/cloudflare/caching. `src/proxy.ts` (the admin
prefix rewrite) runs as Node.js middleware, which OpenNext marks experimental
on Cloudflare: verify admin entry, refresh and RSC navigation with
`pnpm run preview` after touching it. Do not deploy on the user's behalf; after
validation, tell the user to run `pnpm run deploy`.
