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

## Design

- **[`design.md`](./design.md)(같은 폴더) 가 디자인 톤의 SSOT** — 페이지 작업 전 **가장 먼저 참고**하고, 톤이 정해지거나 바뀌면 **가장 먼저 그 문서를 수정**한다. (컨셉·현재 시스템·수정 위치 가이드가 거기 있다)
- 모든 디자인 요소는 목적을 설명할 수 있어야 한다. 정보 위계·이해·행동·상태 피드백·브랜드 인상에 기여하지 않고, 제거해도 의미와 사용성이 같다면 삭제한다.
- 프로젝트 고유 원칙이 아직 없으면 `design.md`의 기본 편집 규칙을 그대로 따른다. 특히 공개 랜딩은 **한 섹션에 한 메시지**, **큰 문장 + 증거가 되는 시각물**을 기본으로 하고, 작은 eyebrow·부제·헬퍼 캡션을 습관적으로 쌓지 않는다.
- 본문과 설명은 기본적으로 `text-soft-foreground`를 쓴다. `text-muted-foreground`는 날짜·개수·작성자·입력 도움말처럼 읽지 않아도 핵심 작업을 완료할 수 있는 보조 정보에만 쓴다.
- 모든 컴포넌트가 토큰 시스템을 따르므로 **`src/app/globals.css` 의 프로젝트 테마 블록에서 `:root` 값만 덮으면 전체 반영**. 토큰 정의 자체는 `src/app/comwit-tokens.css`(comwit-ui 설치본)에 있고, 그 파일은 고치지 않는다. 새 토큰 추가는 `globals.css` 에.
- 사용 핵심: 면↔텍스트는 `bg-X`/`text-X-foreground` 쌍 · 타입은 목적형(`text-display-*`/`title-*`/`body`/`caption`) · 반경/그림자도 토큰(`shadow-card`).
- **토큰이 있으면 토큰을 쓴다.** `bg-[color:var(--primary)]`→`bg-primary`, `text-[14px]`→`text-label`, `shadow-[var(--shadow-card)]`→`shadow-card`.
- **raw hex·arbitrary 는 가급적 피하되, 금지는 아니다.** 한 곳에서만 쓰는 장식색·서드파티 브랜드색·런타임 값(`w-[var(--radix-popover-trigger-width)]`)·레이아웃 값(`max-h-[280px]`)은 그 자리에서 그냥 쓴다.
  **반복되기 시작하면** 그때 `@theme` 에 토큰으로 올린다 — 한 파일에서만 쓰는 색을 억지로 전역 토큰으로 만들지 말 것.

## UI Components
- **UI는 comwit-ui 설치본이다.** `src/lib/components/ui/*`(+ `src/lib/popup.tsx` · `interaction.ts` · `overlay-motion.tsx` · `ui-text.ts` · `utils/cn.ts`)는 `comwit-ui` CLI가 설치한 소스이고, 동작 엔진은 `@comwit/ui`다. 설정은 루트 `comwit.json`.
- **컴포넌트를 쓰기 전에 그 파일을 읽는다** — 설치된 파일이 곧 API 문서다(파트·props·사용 예시가 파일 머리 주석에 있다).
- **없는 컴포넌트는 직접 만들지 말고 먼저 설치한다**: `pnpm ui list`로 확인하고 `pnpm ui add <name>`. 레지스트리에 없는 것만 설치된 컴포넌트를 조합해 만든다. 갤러리: https://library.comwit.io/ui/components
- 설치 파일은 프로젝트 소유라 고칠 수 있지만, 모양은 먼저 토큰(`globals.css`)으로 바꾼다. `pnpm ui add <name> --overwrite`는 로컬 수정을 덮는다.
- **문구**: 기본 문구·스크린리더 이름·피커 날짜 로케일은 `src/lib/ui-text.ts`(한국어판) 하나에 있다. 앱 전체 문구는 그 파일을, 한 화면만 다르면 컴포넌트의 `labels`/`placeholder`/`title` prop을 쓴다.
- **native 인터랙션 요소 금지 (Oxlint 강제)** → `<button>` `<input>` `<select>` `<textarea>` 직접 사용 불가. 규칙: `custom/no-native-interactive` (범위: `src/services/**/*.tsx`, admin `_components` 제외). 설치된 컴포넌트를 쓴다:
  - 액션·입력: `Button`, `Chip`, `Input`, `InputGroup`, `Textarea`, `TextField`(라벨·도움말·에러), `Form`(react-hook-form), `Select`, `Autocomplete`, `Checkbox`, `RadioGroup`, `Switch`, `SegmentedControl`
  - 날짜·리치텍스트: `DatePicker` / `TimePicker` / `MonthPicker`, `Calendar`, `Editor`(Tiptap)
  - 오버레이: `Dialog`, `Sheet`, `BottomSheet`(끌어내려 닫기), `Popover`, `DropdownMenu`, `popup.confirm` / `popup.alert` / `popup.sheet`(`@/lib/popup`)
  - 알림: `toast`(`@/lib/components/ui/toast` — `sonner`를 직접 import 하지 않는다), `Alert`
  - 표시·데이터: `Card`, `Badge`, `Avatar`, `Skeleton`, `EmptyState`, `Separator`, `Tabs`, `Accordion`, `Collapsible`, `Table`, `DataTable`(서버 페이지네이션), `Pagination` / `Pager`
  - 모바일 앱: `Glass`, `Chat`(가상화 메시지 목록·컴포저), `DragScroller`만 미리 있다. 앱 셸(`AppShell`/`TabShell`, `AppScreen`/`DetailScreen`, `AppBar`, `BottomNav`/`TabBar`, `PageTransition`+`RouteBoundary`, `PullToRefresh`)은 선설치본에 없다 — `app-setup` 스킬이 `pnpm ui add app-shell app-screen`으로 라우터에 맞춰 설치하고 배치한다. 앱바·바텀내비·스크롤러를 새로 만들지 않는다.
- 스크롤 크롬(`ScrollChromeProvider`/`useScrollChrome`)과 `useMobile`은 `@comwit/ui`에서 import 한다(설치 파일이 없다).
- **Admin pages**: `@/services/admin/_components`는 어드민 전용 조합만 가진다 — `AdminShell`(반응형 사이드바), `AdminPage`/`AdminSection`/`AdminPageHeader`, `AdminStatCard`/`AdminChartCard`/`AdminCharts`, `AdminDefinitionList`, `AdminListRow`, `AdminReasonDialog`, 카드 표면 클래스(`adminCard` …). 입력·배지·아바타·빈 상태·테이블은 위 ui 컴포넌트(`TextField`+`Input`, `Chip`, `Avatar`, `EmptyState`, `DataTable` …)를 그대로 쓴다.
- **Date/time inputs & bottom sheets**: `DatePicker` / `TimePicker` / `MonthPicker` auto-switch desktop Popover ↔ mobile bottom sheet via `useMobile`. For imperative mobile sheets/confirms use `popup.sheet` / `popup.confirm` / `popup.alert`.
- Tailwind v4
- **Text wrap**: prefer the `text-balance` option (`text-wrap: balance`) for headings/short text to keep lines evenly balanced
- **Animation**: Tailwind CSS animations by default. For complex effects, use `motion` from `motion/react` (avoid relayout: prefer scale, translate, opacity over x, y, width, height)
- Use regular `<img>` tags (NOT Next.js `<Image>` component)
- For initial design: use Unsplash images (`https://images.unsplash.com/...`)
- Icons: use `lucide-react` package

## 이미지 업로드

이미지는 **업로드 전 클라에서 리사이즈**하고, **`ImageAsset { url, width, height }` 하나로 통일**해서 저장한다. (리사이즈 유틸 `resizeImage` 와 `ImageAsset` 타입은 `@/lib/image` — 스토리지를 연결할 때 함께 추가한다.)

- **업로드 전 반드시 `resizeImage()`** — 원본을 그대로 올리지 않는다. 모바일 업로드 용량/시간과 Storage 저장비용을 줄인다.
- 저장 형태는 `ImageAsset` 로 통일. 리사이즈 결과의 `width`/`height` 를 그대로 넣는다. (DB `image` 칼럼 = `JSON.stringify(ImageAsset)` — repository 규약 참고, 여러 장은 `ImageAsset[]`)
- 표시할 때 `<img src={image.url} width={image.width} height={image.height} />` 로 넘겨 **레이아웃 시프트(CLS) 방지**.
- 레이어: **리사이즈·PUT 업로드는 클라(page)**, **presign URL 발급은 api 레이어(server action)** → state 액션으로 연결.
- 모바일 안전: EXIF 회전 고정 + 디코드-단계 다운샘플 + webp 인코딩을 유틸이 처리하므로 폰 사진도 그대로 넘기면 된다.

```tsx
import { resizeImage, type ImageAsset } from "@/lib/image"

// 1) 클라에서 축소 (긴 변 1600px, webp)
const { blob, width, height } = await resizeImage(file)
// 2) presign 발급은 state 액션 경유 (내부적으로 api → 스토리지 presign)
const { key, url, method, headers, publicUrl } = await upload.actions.getUploadUrl(blob.type)
// 3) API가 돌려준 method/headers 그대로 S3 data plane에 직접 전송
await fetch(url, { method, headers, body: blob })
// 4) publicUrl은 서버가 Storage 설정과 key로 구성한 값이다. token은 응답에 넣지 않는다.
if (!publicUrl) throw new Error("Public Storage가 필요한 이미지 업로드예요.")
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
