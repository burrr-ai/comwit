<!-- app-setup:routing -->
## Mobile App Route Groups (app-setup 적용됨)

공통 셸은 설치되어 있다. 제품별 페이지는 아래에 추가한다. 앱에서는 위 기본 폴더·Detail Pages 예시 대신 이 배치를 따른다.

```text
src/app/(app)/
├── (top-level)/posts/page.tsx     # 목록 탭
├── (detail)/posts/[id]/page.tsx   # 상세 본 경로
└── (.)posts/[id]/page.tsx         # SEO 상세에만 추가하는 앱 내부 진입점
```

**클라이언트 로딩이면 본 경로 하나로 끝낸다.** SEO가 필요한 상세만 직접 진입·새로고침은 서버가 내용을 만들고, 앱 내부 이동은 list seed를 바로 보여주도록 두 경로로 나눈다. 두 경로는 같은 상세 UI를 사용한다.

```tsx
// 클라이언트 로딩: (detail)/posts/[id]/page.tsx
// SEO 상세라면 이 코드는 (.)posts/[id]/page.tsx에 둔다.
import { PostClientRoute } from '@/services/app/page/post-detail'
export default function Page() { return <PostClientRoute /> }
```

```tsx
// SEO가 필요한 경우의 본 경로: (detail)/posts/[id]/page.tsx
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

- 링크는 항상 정식 URL `/posts/:id`다. 필요한 `generateMetadata`는 SEO 본 경로에 둔다.
- 탭 목록·순서는 `layout/app-tabs.ts`에 맞춘다. `/` 탭은 `(top-level)/page.tsx`이며 `(app)/page.tsx`는 남기지 않는다.
- 셸은 `layout/client.tsx`의 `<AppShell tabs={APP_TABS}>`(스크롤러·새로고침·전환·뒤로가기)와 `(top-level)/layout.tsx`의 `<TabShell>`(탭바)이 전부다 — 둘 다 `@/lib/components/ui/app-shell` 설치본이고, 탭 경로끼리는 탭바가 남고 그 밖은 drill 로 들어간다.

client adapter와 seed 조회는 `src/services/state.ai.md`, 상세 화면은 `src/services/page.ai.md`의 예시로 연결한다.
<!-- /app-setup:routing -->
