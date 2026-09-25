# @comwit/ui-templates

**Comwit UI 의 스타일 레이어** — [`@comwit/ui`](https://www.npmjs.com/package/@comwit/ui) 헤드리스 엔진 위에
Tailwind 토큰 + `cva` variant 로 **시각만** 입힌 컴포넌트.

배포 철학은 **shadcn 에서 영감(inspired)만** 받았다 — "스타일 컴포넌트를 블랙박스 패키지로 설치하는 게 아니라
소스를 내 프로젝트로 가져와 **소유·수정**한다". 단 **shadcn 툴엔 의존하지 않는다**. 설치는 comwit 자체 CLI
**[`comwit-ui`](../cli)** 로 한다(수동 복붙 아님 — shadcn 처럼 CLI 를 배포한다).

핵심은 **큐레이션 킷**이다 — UI 구성에 필요한 역할마다 최적화된 라이브러리를 고르고(페이지 전환 ssgoi ·
토스트 sonner · 팝업 overlay-kit · 스프링 motion · 에디터 tiptap · 테이블 TanStack Table · 달력 react-day-picker ·
폼 react-hook-form · 채팅 가상화 react-virtuoso), **중성 이름**과 한 벌의 토큰으로 감싸 소스로 설치한다. 라이브러리 자체는 npm 의존성으로
깔리고, 래퍼는 내 코드가 된다. docs 의 컴포넌트 카드마다 "Built on …" 으로 원 라이브러리에 링크한다.

## 설치

```bash
npx comwit-ui@latest init          # comwit.json + 토큰 계약 배선 + 베이스 deps
npx comwit-ui@latest add button    # 컴포넌트 + registryDependencies + npm deps
```

- **시각 컴포넌트(.tsx)** → CLI 가 내 `components/ui/` 로 복사(내 소유, 자유 수정) + import 경로를 내 alias 로 재작성.
- **`@comwit/ui`**(헤드리스 엔진) → CLI 가 npm 으로 설치(동작·a11y·IME·포커스·달력/시간·에디터 로직).
- **토큰 계약** → `init` 이 `comwit-tokens.css` 를 쓰고 전역 CSS 에 `@import` 배선. 기본은 컴윗 블루 + Pretendard이며 리브랜딩은 `--brand` 계열을 덮는다.
  성격(직각/둥글/그림자/모션)은 `--radius-scale` · `--border-width` · `--elevation-*` · `--duration-*` 같은 L0 노브로.
  다크는 `.dark` 클래스 하나. **프리셋 테마는 싣지 않는다** — 토큰만 싣고 쓰는 쪽이 `:root` 에서 덮는다. 컴포넌트 수정 0.
  → 전체 토큰 표 · 노브 영향 범위: [루트 README](../../README.md#토큰-계약-테마--커스터마이징)

CLI 명령/플래그/`comwit.json`/동작 방식 상세는 **[`comwit-ui` README](../cli/README.md)** 참고.

## 프로바이더 배선

`popup.confirm/alert/sheet` 는 [overlay-kit](https://overlay-kit.slash.page/), 토스트는
[sonner](https://sonner.emilkowal.ski/) 위에 우리 유리 `<Toast>` 를 꽂는다(`toast.tsx` 의 `toast()` 로 부른다 —
sonner 의 toast 를 직접 부르면 기본 스킨으로 뜬다). 앱 루트에 한 번 마운트한다:

```tsx
'use client'
import { OverlayProvider } from 'overlay-kit'
import { Toaster } from '@/components/ui/toast' // toast 컴포넌트도 add 대상

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OverlayProvider>
      {children}
      <Toaster />
    </OverlayProvider>
  )
}
```

## 페이지 전환

`page-transition` 은 라우터를 바꾸지 않고 라우트 전환에 네이티브 앱 모션(드릴 · 시트 · 슬라이드 …)을 입힌다.
엔진은 [`@ssgoi/react`](https://ssgoi.dev) 이고, 이름은 전부 중성적이다 — `PageTransition`(프로바이더) ·
`PageBoundary`(라우트가 소유한 DOM 경계) · `RouteBoundary`(라우터의 pathname 을 대신 읽는 경계).

`comwit-ui add page-transition` 이 `package.json` 에서 라우터를 감지해 `route-boundary.tsx` 구현체를 고른다
(`next` → App Router · `react-router(-dom)` · `@tanstack/react-router` · 그 외 → `path` prop 을 받는 generic).
`--router <name>` 으로 직접 지정할 수 있다. 소스는 `src/routers/route-boundary.<variant>.tsx`.

```tsx
// app/layout.tsx — 라우팅되는 영역을 한 번 감싼다
<PageTransition
  config={{ transitions: [{ on: '/posts/**', except: '/posts', transition: drill() }] }}
>
  <RouteBoundary>{children}</RouteBoundary>
</PageTransition>
```

탭바가 살아남는 쉘은 바깥 `RouteBoundary` 에 `routeKey` 를 고정하고 바뀌는 콘텐츠만 안쪽 경계로 감싼다.
규칙(`on/except` · `from/to` · `ordered`)·프리셋 옵션·스크롤 복원·트러블슈팅은 엔진 문서 [ssgoi.dev](https://ssgoi.dev/docs) 를 그대로 따른다(설정 모양이 같고 컴포넌트 이름만 다르다).

## 채팅

`chat` 은 헤더 · 메시지 · 컴포저 세로 3단을 컴파운드 파트로 싣는다. `Chat` 이 부모를 채우고(부모에 높이가 있어야
한다: `h-dvh` · `flex-1 min-h-0`), `ChatMessages` 가 [react-virtuoso](https://virtuoso.dev) 로 가상화한 목록이다.
동작(가상화 · 스크롤 규칙 · 안 읽음 카운트 · Enter/IME · 자동 높이)은 전부 `@comwit/ui` 의 `Chat` 프리미티브가 갖고,
템플릿 파일은 파트를 조립해 `data-tone` · `data-align` 에 토큰을 입힐 뿐이다 — 스타일을 바꿔도 동작은 안 깨진다.
데이터 모양은 강제하지 않는다 — `items` 는 무엇이든, `isOwn` 이 "내 메시지" 를 가른다(기본 `role === 'user'`).

`mode` 가 스크롤 규칙을 정한다:

- **messenger** — 사람과의 대화. 내 메시지는 언제나 바닥으로, 상대 메시지는 바닥에 있을 때만 따라간다.
  위로 올라가 읽는 중이면 안 읽은 개수를 단 유리 알약(`ChatScrollToBottom`)이 뜬다.
- **assistant** — AI. 보낸 메시지가 **맨 위로 올라가 붙고** 답변이 그 아래로 흘러내린다(아래 여백은 답변이 채우며
  줄어들어 튀지 않는다). 답변이 화면을 넘기면 바닥에 있을 때만 따라간다. 왼쪽 말풍선은 면 없는 `plain` 톤이 기본.

```tsx
<div className="h-dvh">
  <Chat mode="messenger">
    <ChatHeader>
      <ChatTitle>Ava Chen</ChatTitle>
    </ChatHeader>
    <ChatMessages
      items={messages}
      isOwn={(m) => m.mine}
      footer={
        typing ? (
          <ChatMessage>
            <ChatTyping />
          </ChatMessage>
        ) : null
      }
    >
      {(m) => (
        <ChatMessage align={m.mine ? 'end' : 'start'}>
          <ChatBubble>{m.text}</ChatBubble>
          <ChatMessageMeta>{m.time}</ChatMessageMeta>
        </ChatMessage>
      )}
    </ChatMessages>
    <ChatComposer onSend={send} pending={streaming} onStop={stop} />
  </Chat>
</div>
```

`ChatComposer` 는 Enter 로 보내고 Shift+Enter 로 줄바꿈하며(한글 조합 중 Enter 는 무시), 자식 없이 쓰면 입력 + 보내기
버튼을 그리고 `ChatComposerInput` · `ChatComposerActions` · `ChatComposerSubmit` 으로 직접 조립할 수도 있다.
톤은 전부 토큰이다 — 내 말풍선 `bg-primary` · 상대 `bg-muted` · 컴포저 면 `rounded-sheet` + `shadow-message`.

## 사용

```tsx
import { Button } from '@/components/ui/button' // CLI 가 복사한 경로

;<Button variant="secondary" size="lg">
  Save
</Button>
```

동작·a11y·IME·포커스·달력/시간 로직은 전부 `@comwit/ui`(엔진)가 소유하고, 이 파일은 cva 로 **시각/variant 만** 입힌다.
그래서 컴포넌트를 열어 Tailwind 클래스를 마음대로 고쳐도 동작은 안 깨진다.

## 컴포넌트 (44 + popup)

docs 갤러리와 같은 묶음 — 컴윗 특화 UX 가 먼저, 기본형이 마지막.

- **모바일 앱** — app-bar · bottom-nav · page-transition(+ route-boundary) · pull-to-refresh · drag-scroller
- **채팅** — chat(`Chat` · `ChatHeader` · `ChatMessages`(가상화) · `ChatMessage` · `ChatBubble` · `ChatTyping` · `ChatComposer` …)
- **유리** — glass(`Glass` · `GlassSurface` · `GlassButton`) · dropdown-menu · popover · (dialog · sheet · popup · 토스트도 같은 굴절 유리 — 스크림 위라 `dense`)
- **알림** — toast(`Toaster` · `toast()` · `Toast`) · `lib/popup`(confirm · alert · sheet) · alert · empty-state
- **피커** — date-picker · time-picker · month-picker (데스크톱 팝오버 · 모바일 바텀시트) · calendar
- **선택** — segmented-control · chip · checkbox · radio-group · pager
- **폼·데이터** — text-field · autocomplete · select · form · data-table · editor
- **기본형** — button · badge · input · input-group · textarea · label · switch · tabs · accordion · collapsible ·
  dialog · sheet · card · table · avatar · separator · skeleton · pagination

공용: `lib/utils`(토큰을 아는 `cn`) · `lib/interaction`(focusRing 등) · `lib/popup`(overlay-kit 래퍼).
동작 훅은 엔진이 내보낸다 — `import { ScrollChromeProvider, useScrollChrome, useMobile } from '@comwit/ui'`
(앱바 reveal · 바텀내비 compact 가 공유하는 스크롤 의도, 모바일 감지). 복사할 `hooks/` 파일은 없다.

**동작은 프리미티브, 템플릿은 스타일.** 앱바(`AppBar.Root`) · 바텀내비(`BottomNav.Root/Item`) · 드래그 스크롤러
(`DragScroller.Root/Track`) · 당겨서 새로고침(`PullToRefresh.Root/Scroller/Indicator`) · 채팅(`Chat.*`) · 유리 렌즈
(`useGlassLens`)의 JS 는 `@comwit/ui` 에 있고, 템플릿은 프리미티브가 방출하는 `data-state` · `data-tone` 같은
속성에 토큰을 입힌다. 새 컴포넌트를 짤 때도 같은 규칙이다: 제스처·스크롤·키보드 같은 동작은 코어에 옵션으로,
템플릿에는 className 과 슬롯 조립만.

피커·페이저·데이터 테이블의 표시 문구는 영어가 기본이고 `locale`·`labels` 로 바꾼다
(예: `<DatePicker locale="ko-KR" labels={{ today: '오늘', clear: '지우기' }} />`).

> 카탈로그(`apps/ui-dev`, http://localhost:3007)와 스토리북(`apps/storybook`, http://localhost:6008)에서
> variant별로 미리 볼 수 있다.
