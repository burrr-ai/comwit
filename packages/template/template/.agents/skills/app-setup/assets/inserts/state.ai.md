<!-- app-setup:detail-state -->
## Mobile App Detail State (app-setup 적용됨)

id로 **글로벌 list query에서 seed를 읽고, detail query는 독립적으로 로드**한다. seed는 뷰에 넘기는 값이다. 이를 detail에 쓰거나 합치거나 hydrate하지 않는다.

```tsx
// 서비스 page의 공통 client 상세 컴포넌트
function PostDetail({ id, load = false }: { id: string; load?: boolean }) {
  const post = usePost((state) => ({
    seed: state.posts.data.items.find((item) => item.id === id),
    detail: load ? state.detail.load(id) : state.detail,
  }))
  const detail = post.detail.isSuccess && post.detail.data?.id === id
    ? post.detail.data : undefined

  // 완료된 오류/not-found는 도메인 정책에 맞춰 먼저 처리한다.
  return <PostView seed={post.seed} detail={detail} />
}
```

```tsx
// 클라이언트 본 경로 또는 SEO 상세의 인터셉트에서 사용
function PostClientRoute() {
  const { id } = useParams<{ id: string }>()
  return <PostDetail id={id} load />
}

// SEO 서버 loader가 받은 완전한 응답만 detail에 hydrate한다.
function PostHydratedRoute({ id, initialPost }: Props) {
  usePost.hydrate({ detail: { arg: id, data: initialPost } })
  return <PostDetail id={id} />
}
```

`posts`는 프로젝트의 기존 목록 query로 바꾼다. seed를 찾으려고 목록을 다시 요청하지 않는다. seed와 detail은 현재 id·사용자 범위가 맞는 값만 읽고, 상세에는 `keepPreviousData`를 쓰지 않는다. hydration adapter는 state를 구독하지 않는다.

화면의 전체/부분 로딩 분기는 `page.ai.md` → Mobile App Detail UI를 따른다.
<!-- /app-setup:detail-state -->
