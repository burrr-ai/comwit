# Page Layer

## Location
`services/{service}/page/{route}/`

## Structure

**Always split page into separate section files.** Don't put everything in one file.

```
page/{route}/
  ├── index.tsx           # Compose sections only
  ├── hero-section.tsx
  ├── features-section.tsx
  └── cta-section.tsx
```

- `index.tsx` imports and arranges sections
- Each section is its own file
- Keeps code organized and maintainable

## Layout

```
page/layout/
  ├── index.tsx       # Async Server Component: awaits basic getMe()
  ├── client.tsx      # Client: hydration adapter (no user subscription)
  └── content.tsx     # Optional child: user subscriptions + App UI
```

- The app-router service wrapper renders `<Suspense fallback={null}>` above the async service layout. Keep this structure before auth setup; the skill replaces the marked mock/session wiring.
- Server component (`index.tsx`): awaits basic `getMe()` and passes `initialUser: User | null` to the client adapter. Only Better Auth session/user fields belong in this result.
- Client component (`client.tsx`): only calls `useUser.hydrate({ me: { data: initialUser } })` and renders children. Keep normal user-hook subscriptions, account effects, and interactive UI in child components (e.g. `content.tsx`). This prevents user mutations from rerendering the adapter and replaying an old server seed after logout. Consumers read `state.me.data` without initiating another load.
- The auth boundary has no skeleton or anonymous shell. Separate member/profile/business table data loads lazily through separate queries after the user is known; see `state.ai.md`.
- Session errors propagate; `null` means confirmed anonymous. Keep server guards for protected routes and API authorization.
- Root Layout is `src/lib/layout/` (`index.tsx` server + `client.tsx`; globals: StateProvider, OverlayProvider, `Toaster` from `@/lib/components/ui/toast`)

## Rules
- `'use client'` required (except for layout server components)
- Use `<img />` (do not use `<Image />`)
- For internal routing, use `<Link>` from `next/link` (do not use `<a>`). External links (`http://`, `https://`, `mailto:`, `tel:`, `#anchor`) may use `<a>`
- Do not import API directly → go through state
- Select actions as the complete collection: `actions: state.actions`. Never use `useDomain((state) => state.actions.method)` or alias individual action methods inside the selector; partial selection of the actions proxy can cause a Runtime TypeError.
- layout/index.tsx is a server component, layout/client.tsx is a client component
- Resolve basic auth on the server below the null Suspense boundary; do not bootstrap it from `useEffect` or an initial selector `.load()`.
- Domain-data Suspense boundaries use a simple skeleton fallback. The service-root auth boundary uses `null`.
- **No client-side data processing** → do all processing in the API:
  - No aggregation like `.filter().length`, `.reduce()` → group/sum in the API
  - No status filtering like `.filter(o => o.status === 'x')` → where conditions in the API
  - No slicing like `.slice(0, N)` → use limit/order by in the API
  - Reason: with pagination, you only have current-page data, which produces incorrect numbers; processing partial (not whole) data is always wrong

## Storybook

- Read [`.storybook/stories/.ai.md`](../../.storybook/stories/.ai.md) before page work.
- Maintain page stories with real service layouts in `.storybook/stories/{service}/`.
- Group by design system/user type, then page/state. Do not create standalone component/layout stories or a `/design` route.
- **Mock only the API boundary.** Use real state/query/action, pages, and layouts. Do not inject store state to simulate loading, empty, or error screens. Only the layout's server-auth `initialUser` receives a fixed fixture.

## Design

- **[`design.md`](./design.md) is the design source of truth. Read it first** before page work and **update it first** when design direction changes. It covers the concept, current system, and editing locations.
- Every design element needs a purpose: hierarchy, understanding, action, state feedback, or brand impression. Remove elements whose absence leaves meaning and usability unchanged.
- Until the project defines its own principles, follow `design.md`. Public landing pages use **one message per section**, expressed as **a large statement and a supporting visual**. Avoid habitual eyebrows, subtitles, and helper captions.
- Use `text-soft-foreground` for body copy and descriptions. Reserve `text-muted-foreground` for supporting dates, counts, authors, and field help unnecessary for the core task.
- Components follow the token system: **override `:root` in the project theme block of `src/app/globals.css` to update the whole app**. Do not edit installed `src/app/comwit-tokens.css`; add new tokens in `globals.css`.
- Pair surfaces/text with `bg-X`/`text-X-foreground`. Use purpose-specific typography (`text-display-*`/`title-*`/`body`/`caption`) and radius/shadow tokens such as `shadow-card`.
- **Use existing tokens:** `bg-[color:var(--primary)]` → `bg-primary`, `text-[14px]` → `text-label`, `shadow-[var(--shadow-card)]` → `shadow-card`.
- **Avoid raw hex/arbitrary values where practical, but they are allowed** for one-off decoration, third-party brands, runtime values (`w-[var(--radix-popover-trigger-width)]`), and layout values (`max-h-[280px]`). Promote them to `@theme` tokens when they repeat; do not force single-file colors into global tokens.

## UI Components

- **UI source is installed by comwit-ui.** `src/lib/components/ui/*`, `popup.tsx`, `interaction.ts`, `overlay-motion.tsx`, `ui-text.ts`, and `utils/cn.ts` are CLI-installed source powered by `@comwit/ui`. Configuration lives in root `comwit.json`.
- **Read each component file before using it.** Its header documents parts, props, and examples.
- **Install missing components before building them:** check `pnpm ui list`, then `pnpm ui add <name>`. Compose existing components only for controls missing from the registry. Gallery: https://library.comwit.io/ui/components
- Installed files are project-owned and editable, but change appearance through `globals.css` tokens first. `pnpm ui add <name> --overwrite` replaces local edits.
- **Labels:** default labels, screen-reader names, and picker date locale are centralized in the Korean resource `src/lib/ui-text.ts`. Edit it for app-wide defaults; use `labels`/`placeholder`/`title` props for individual screens.
- **No native interactive elements (enforced by Oxlint):** `<button>`, `<input>`, `<select>`, and `<textarea>` are forbidden by `custom/no-native-interactive` in `src/services/**/*.tsx`, except admin `_components`. Use installed components:
  - Actions/inputs: `Button`, `Chip`, `Input`, `InputGroup`, `Textarea`, `TextField` (label/help/error), `Form` (react-hook-form), `Select`, `Autocomplete`, `Checkbox`, `RadioGroup`, `Switch`, `SegmentedControl`.
  - Dates/rich text: `DatePicker`, `TimePicker`, `MonthPicker`, `Calendar`, `Editor` (Tiptap).
  - Overlays: `Dialog`, `Sheet`, `BottomSheet` (drag to dismiss), `Popover`, `DropdownMenu`, and `popup.confirm`/`popup.alert`/`popup.sheet` from `@/lib/popup`.
  - Notifications: `toast` from `@/lib/components/ui/toast` (never import `sonner` directly), `Alert`.
  - Display/data: `Card`, `Badge`, `Avatar`, `Skeleton`, `EmptyState`, `Separator`, `Tabs`, `Accordion`, `Collapsible`, `Table`, `DataTable` (server pagination), `Pagination`, `Pager`.
  - Mobile apps: only `Glass`, `Chat` (virtualized messages/composer), and `DragScroller` are preinstalled. App shells (`AppShell`/`TabShell`, `AppScreen`/`DetailScreen`, `AppBar`, `BottomNav`/`TabBar`, `PageTransition` + `RouteBoundary`, `PullToRefresh`) are installed and routed by `app-setup` with `pnpm ui add app-shell app-screen`. Do not recreate app bars, bottom navigation, or scrollers.
- Import scroll chrome (`ScrollChromeProvider`/`useScrollChrome`) and `useMobile` from `@comwit/ui`; they have no installed source files.
- **Admin pages:** `@/services/admin/_components` contains only admin compositions: responsive `AdminShell`, `AdminPage`/`AdminSection`/`AdminPageHeader`, `AdminStatCard`/`AdminChartCard`/`AdminCharts`, `AdminDefinitionList`, `AdminListRow`, `AdminReasonDialog`, and card surface classes such as `adminCard`. Reuse UI controls (`TextField` + `Input`, `Chip`, `Avatar`, `EmptyState`, `DataTable`, etc.).
- **Date/time inputs & bottom sheets**: `DatePicker` / `TimePicker` / `MonthPicker` auto-switch desktop Popover ↔ mobile bottom sheet via `useMobile`. For imperative mobile sheets/confirms use `popup.sheet` / `popup.confirm` / `popup.alert`.
- Tailwind v4
- **Text wrap**: prefer the `text-balance` option (`text-wrap: balance`) for headings/short text to keep lines evenly balanced
- **Animation**: Tailwind CSS animations by default. For complex effects, use `motion` from `motion/react` (avoid relayout: prefer scale, translate, opacity over x, y, width, height)
- Use regular `<img>` tags (NOT Next.js `<Image>` component)
- For initial design: use Unsplash images (`https://images.unsplash.com/...`)
- Icons: `@comwit/ui/icons` (static SVG, `<SearchIcon />`) and `@comwit/ui/icons/animated` for spring motion; browse names at https://library.comwit.io/ui/icons. No other icon package.

## Image Uploads

**Resize images on the client before uploading** and store the standard **`ImageAsset { url, width, height }`** shape. (The `resizeImage` utility and `ImageAsset` type live in `@/lib/image`, added when connecting storage.)

- **Always call `resizeImage()` before uploading.** Do not upload unchanged originals; resizing reduces mobile transfer time/size and storage costs.
- Save the resulting `width`/`height` in `ImageAsset`. The DB `image` column stores `JSON.stringify(ImageAsset)`; use `ImageAsset[]` for multiple images. See repository conventions.
- Render `<img src={image.url} width={image.width} height={image.height} />` to **prevent cumulative layout shift (CLS)**.
- **The client page handles resizing and PUT uploads; the API/server action issues presigned URLs**, connected through state actions.
- The utility handles EXIF orientation, decode-stage downsampling, and WebP encoding for mobile photos.

```tsx
import { resizeImage, type ImageAsset } from "@/lib/image"

// 1) Resize on the client (1600px longest edge, WebP).
const { blob, width, height } = await resizeImage(file)
// 2) Obtain a presigned URL through a state action (internally API → storage presign).
const { key, url, method, headers, publicUrl } = await upload.actions.getUploadUrl(blob.type)
// 3) Send directly to the S3 data plane using the API's method/headers unchanged.
await fetch(url, { method, headers, body: blob })
// 4) The server builds publicUrl from storage settings and the key; never return the token.
if (!publicUrl) throw new Error("This image upload requires public storage.")
const image: ImageAsset = { url: publicUrl, width, height }
```

## How to Use Domain State

### Import domain state

```tsx
import { useDomain } from "@/services/{service}/state/{domain}";
import type { DomainType } from "@/services/{service}/state/{domain}";
```

### Rules

- One domain hook call per file
- No destructuring - use namespace style
- Access via `domain.field` and `domain.actions.method()`
- When the view owns an initial query, call `.load(arg?)` explicitly inside the selector. Do not trigger the initial load with `useEffect`.
- Select a query field without `.load()` only when SSR initialization or a state action intentionally owns loading.

### Example

```tsx
// Good: One call, namespace style
const product = useProduct((state) => ({
  products: state.products.load({ page }),
  actions: state.actions,
}));

// Bad: Multiple calls for same domain
const products = useProduct((state) => state.products);
const actions = useProduct((state) => state.actions);

// Bad: Destructuring
const { products, actions } = useProduct();
```

### Using query data

In addition to `data`, query fields also provide loading/error states.

```tsx
const product = useProduct((state) => ({
  products: state.products.load({ page }),
  actions: state.actions,
}));

// isError — error occurred
if (product.products.isError) return <Error error={product.products.error} />

// isLoading — initial load (no cache)
if (product.products.isLoading) return <Skeleton />

// data — actual data
return product.products.data.items.map((p) => <Card key={p.id} product={p} />)
```

### isFetching — background re-fetch

`isFetching` is `true` while a background request such as refetch or page transition is in flight.
Unlike `isLoading`, it operates while keeping the existing data in place.

```tsx
function ProductsPage({ page }: { page: number }) {
  const product = useProduct((state) => ({
    products: state.products.load({ page }),
    actions: state.actions,
  }));

  if (product.products.isError) return <Error error={product.products.error} />
  if (product.products.isLoading) return <Skeleton />

  return (
    <div>
      {product.products.isFetching && <Spinner className="fixed top-4 right-4" />}
      {product.products.data.items.map((p) => <Card key={p.id} product={p} />)}
      <Pagination
        currentPage={product.products.data.page}
        totalPages={product.products.data.totalPages}
        onPageChange={(nextPage) => product.actions.openPage(nextPage)}
      />
    </div>
  )
}
```

> `isLoading` = first load (no data) · `isFetching` = background re-fetch (data present)

### Server Suspense

Await server data inside a Suspense loader with a simple skeleton fallback.
Hydrate the resolved data in a client route adapter before normal hook reads.
The service-root auth boundary keeps `fallback={null}`.

```tsx
// app/product/[id]/page.tsx — Server Component
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductLoader params={params} />
    </Suspense>
  )
}

async function ProductLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const initial = await api.product.findById(id)
  return <ProductDetailRoute id={id} initialProduct={initial} />
}
```

## SSR Detail Pages

### SEO Critical (SSR query hydration)

```tsx
"use client";
export default function PostDetailRoute({ id, initialData }) {
  usePost.hydrate({ detail: { arg: id, data: initialData } })
  return <PostDetail />
}

function PostDetail() {
  const post = usePost((state) => ({ detail: state.detail.data }))
  return <PostView post={post.detail} />
}
```

### Non-SEO (client selector loading)

```tsx
"use client";
export default function PostDetail({ id }) {
  const post = usePost((state) => ({
    detail: state.detail.load({ id }),
    actions: state.actions,
  }));

  if (post.detail.isError) return <Error error={post.detail.error} />
  if (post.detail.isLoading) return <PostDetailSkeleton />

  /**
   * (omitted)
   */
}
```
