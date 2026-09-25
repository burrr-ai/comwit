# comwit-ui

컴윗(comwit)의 **자체 헤드리스 UI 프리미티브** 레이어. Radix 같은 "동작만 있는" 프리미티브를
우리가 직접 소유·수정하기 위한 자리다.

> 🚧 **향후 독립 라이브러리로 분리 예정.**
> 이 폴더는 앱(토큰·config·services)에 의존하지 않는 **자기완결 모듈**로 유지한다.
> publish 시점에 이 폴더를 그대로 `packages/comwit-ui` 로 들어올릴 수 있어야 한다.

## 위치 · 경로

- 폴더: `src/comwit-ui/` (일부러 `src` 바로 아래 — "ui 의 일부"가 아니라 ui 가 **올라서는 기반")
- alias: `@comwit-ui` (배럴) · `@comwit-ui/*` (개별 모듈)

## 규칙

1. **공개 진입점은 `index.ts` 배럴 하나.** 소비처는 `@comwit-ui` 에서만 import 한다.
   새 프리미티브 노출 = `index.ts` 에 재-export 추가.
2. **overlay/disclosure·form-control 프리미티브는 Radix Primitives 구현을 그대로 이식한 자체 엔진**이다
   (`dialog.tsx` 등 — 외부 `@radix-ui/*` 의존성 없음, `internal/`에 공유 엔진 유틸을 둔다).
   동작을 더 바꿀 땐 **개별 파일 내부만** 수정 — 배럴/소비처는 불변.
3. 프리미티브는 이름 충돌 방지를 위해 **네임스페이스**로 내보낸다 (`Dialog.Root` …).
   단, 컴포넌트가 아닌 **훅**(`useField` 등 로직)은 flat export.
4. `utils/` 는 라이브러리 내부 유틸(ripple — 위치/타이밍/cleanup만). **Tailwind 등 스타일 문자열은
   여기 없음** — 리플 도트의 시각(색·모양·애니메이션)은 항상 소비 레이어가 `className` 으로 넘긴다
   (packages/ui 는 어떤 CSS 프레임워크 의존도 갖지 않는다). 인터랙션 클래스 상수(focusRing 등)는
   순수 Tailwind 토큰이라 `@comwit/ui-templates/lib/interaction`로 옮겼다.
5. **앱 쪽(`@/…`) import 금지.** react + (자체 엔진 · react-aria) + 순수 유틸만 의존한다.
   - **엔진 선택 기준**: overlay/disclosure·form-control 동작 = 자체 엔진(Radix Primitives 이식,
     `internal/`에 focus-scope·dismissable-layer·popper·collection·roving-focus·menu 등 공유 유틸 보유),
     **a11y 배선 = React Aria** (`field` 는 `@react-aria/label` 의 `useField` 활용 — 검증된 ARIA 를
     자체 구현하지 않는다). IME(한글 조합)·focus/filled 상태는 우리가 그 위에 얹어 소유한다.

## 프리미티브 (요소별)

- **overlay/disclosure (자체 엔진, Radix Primitives 이식)**: accordion · avatar · collapsible · dialog · dropdown-menu · label · popover · select · separator · tabs
- **bottom-sheet**: dialog 엔진 위에 끌어내려 닫기(거리·속도 판정 · 안쪽 스크롤 양보) — `--sheet-drag` · `--sheet-drag-progress` · `data-dragging` 으로 시각을 넘긴다
- **form-control (자체 엔진, Radix Primitives 이식)**: checkbox · radio-group · switch
- **자체 헤드리스 (radix 에 없던 것)**: button(press/ripple) · input(IME-safe, bare) · textarea(IME-safe)
- **compound (React Aria a11y)**: text-field (= MUI TextField. Root/Label/Control/Description/Error)
- **앱 셸·제스처·대화 (자체 헤드리스 — 동작은 여기, 시각은 templates)**: app-bar · bottom-nav · drag-scroller ·
  pull-to-refresh · chat(react-virtuoso 가상화 + 스크롤 규칙 + 컴포저) · scroll-chrome(훅) · use-mobile(훅) · glass-lens(훅)
  → 프리미티브는 `data-state` · `data-tone` 같은 속성으로 상태를 알리고, 템플릿은 그걸로 스타일만 입힌다.
- **utils**: ripple(위치/타이밍만 — 시각은 없음, `itemClassName` 으로 소비 레이어가 입힌다)

lib/components/ui 는 이들을 re-import 해 **토큰 + cva variant** 로만 시각을 입힌다(a11y·동작은 프리미티브 소유).

## 로드맵

- [x] form-control(checkbox/radio/switch) + button/input/textarea/text-field 프리미티브화, lib 재배선
- [x] Radix re-export 를 프리미티브 단위로 자체 구현(이식) 교체 — `@radix-ui/*` 의존성 완전 제거,
      공유 엔진 유틸은 `internal/`에 정리 (compose-refs·context·primitive·presence·portal·focus-scope·
      dismissable-layer·collection·roving-focus-group·popper·arrow·menu 등)
- [x] `utils/interaction.ts`(순수 Tailwind 토큰) 를 `@comwit/ui-templates/lib/interaction` 로 이관,
      `useRipple`/`useCenterRipple` 는 위치만 소유하고 시각은 `itemClassName` 으로 소비 레이어가 주입
- [ ] 앱/소비처가 `internal/*` 를 직접 import 하지 못하도록 ESLint 로 강제 (공개 진입점은 top-level 배럴만)
- [ ] `packages/comwit-ui` 로 분리 후 publish
