<!-- app-setup:routing -->
## Mobile App Route Groups (app-setup installed)

The shared shell is installed. Add product pages below. For apps, follow this layout instead of the default folder and Detail Pages examples above.

```text
src/app/(app)/
├── (top-level)/posts/page.tsx     # List tab
├── (detail)/posts/[id]/page.tsx   # Canonical detail route
└── (.)posts/[id]/page.tsx         # In-app entry point for SEO details only
```

**Client-loaded details need only the canonical route.** Split only SEO-critical details: direct visits/reloads render content on the server, while in-app navigation immediately displays the list seed. Both routes use the same detail UI.

```tsx
// Client loading: (detail)/posts/[id]/page.tsx
// For SEO details, put this code in (.)posts/[id]/page.tsx.
import { PostClientRoute } from '@/services/app/page/post-detail'
export default function Page() { return <PostClientRoute /> }
```

```tsx
// Canonical route for SEO details: (detail)/posts/[id]/page.tsx
import { Suspense } from 'react'
import { getPost } from '@/services/app/api/post'
import { PostSkeleton, PostHydratedRoute } from '@/services/app/page/post-detail'
type Props = { params: Promise<{ id: string }> }
export default function Page({ params }: Props) {
  return <Suspense fallback={<PostSkeleton />}><Loader params={params} /></Suspense>
}
async function Loader({ params }: Props) {
  const { id } = await params
  return <PostHydratedRoute id={id} initialPost={await getPost(id)} />
}
```

- Always link to the canonical URL `/posts/:id`. Put `generateMetadata` in the canonical SEO route when needed.
- Match tab definitions/order in `layout/app-tabs.ts`. The `/` tab is `(top-level)/page.tsx`; do not retain `(app)/page.tsx`.
- The shell consists of `<AppShell tabs={APP_TABS}>` in `layout/client.tsx` (scrolling, refresh, transitions, back navigation) and `<TabShell>` in `(top-level)/layout.tsx` (tab bar). Both come from installed `@/lib/components/ui/app-shell`. Tab-to-tab navigation preserves the bar; other paths drill into details.

Connect the client adapter and seed lookup using `src/services/state.ai.md`, and the detail screen using `src/services/page.ai.md`.
<!-- /app-setup:routing -->
