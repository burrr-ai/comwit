<!-- app-setup:routing -->
## Mobile App Detail UI (app-setup 적용됨)

상세 화면은 **완전한 detail → list seed → 전체 스켈레톤** 순서로 그린다. seed가 있으면 제목·이미지 등 이미 아는 내용은 유지하고, 아직 없는 본문만 로딩한다.

```tsx
// seed/detail은 state adapter가 넘긴 값. Props는 도메인의 요약/상세 타입이다.
function PostView({ seed, detail }: Props) {
  const header = detail ?? seed
  return (
    <DetailScreen fallback="/posts" actions={<ShareButton />}>
      {header ? (
        <>
          <PostHeader post={header} />
          {detail ? <PostBody post={detail} /> : <PostBodySkeleton />}
        </>
      ) : <PostSkeleton />}
    </DetailScreen>
  )
}
```

위 예시는 정상 로딩/성공 화면이다. not-found·권한 오류가 확정되면 seed도 숨기고 결과를 표시한다. 일시적 요청 실패는 seed가 있으면 기존 내용과 부분 오류·재시도를, 없으면 전체 오류 화면을 보여준다. 서버 Suspense fallback은 단순 `<PostSkeleton />`이다.

탭은 `AppScreen`, 상세는 `DetailScreen`(둘 다 `@/lib/components/ui/app-screen`)으로 감싸고 제목·액션·뒤로가기용 부모 `fallback`을 정한다. 앱바는 기본적으로 탭=`flow`, 상세=`reveal`; 필요할 때만 `appBarBehavior`로 바꾼다. 임시 작성·선택 화면은 `variant="sheet"`로 감싸고, `layout/client.tsx`의 `<AppShell>`에 `transitions={appTransitions(APP_TAB_PATHS, { transitions: [{ on: '/compose', transition: sheet() }] })}`처럼 sheet 규칙을 준다(`appTransitions`·`sheet`는 `@/lib/components/ui/page-transition`). 풀블리드 히어로 상세는 `bar="none"`에 `@/lib/components/ui/app-bar`의 `FloatingBackButton`을 둔다.

앱 셸 UI(AppShell·TabShell·AppScreen·앱바·BottomNav·유리·전환·바텀시트)는 전부 `@/lib/components/ui`의 comwit-ui 설치본이다. `layout/`에는 탭 목록(`app-tabs.ts`)과 PWA 배너만 있다 — 셸·앱바·탭바를 새로 만들지 말고, 모양은 설치본 파일과 토큰(`src/app/globals.css`)에서 바꾼다.

데이터 연결은 `state.ai.md` → Mobile App Detail State를 따른다.
<!-- /app-setup:routing -->
