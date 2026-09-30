import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// OpenNext for Cloudflare Workers. `pnpm run preview` / `pnpm run deploy` call
// `opennextjs-cloudflare build`, which runs the build command below (service
// worker + `next build`) and then bundles the Worker into .open-next/.
// Incremental cache (ISR/revalidate) needs a KV or R2 binding once the product
// relies on it: https://opennext.js.org/cloudflare/caching
export default {
  ...defineCloudflareConfig({}),
  buildCommand: 'pnpm run build',
}
