# Comwit UI

Headless behavior and editable UI components used in Comwit templates.

[Documentation](https://library.comwit.io/ui) · [Components](https://library.comwit.io/ui/components) · [Agent guide](https://library.comwit.io/ui/llms.txt)

```bash
npx comwit-ui@latest init
npx comwit-ui@latest add button dialog input
```

The CLI installs component source into your project. You own and customize those files. `@comwit/ui` remains the behavior engine; the CLI workflow does not require importing `@comwit/ui-templates` in your app.

| Directory              | Package                | Responsibility                              |
| ---------------------- | ---------------------- | ------------------------------------------- |
| [core](core)           | `@comwit/ui`           | Headless behavior and accessibility         |
| [templates](templates) | `@comwit/ui-templates` | Styled source and shared CSS tokens         |
| [cli](cli)             | `comwit-ui`            | Component installation and bundled registry |

Run commands from the repository root: `pnpm build:packages`, `pnpm dev:ui`, `pnpm dev:ui-catalog`, `pnpm storybook`, and `pnpm registry`. Storybook specs in `apps/storybook/specs` supply both stories and documentation examples; the component source is never duplicated for previews.

See the [CLI guide](cli/README.md) and [template guide](templates/README.md) for details.

## 토큰 계약 (테마 · 커스터마이징)

**기본값은 컴윗 디자인 시스템이다** — 따뜻한 화이트 + 딥 잉크 + 토스톤 블루(`#3182f6`), Pretendard, 굴절 유리.
컴포넌트(cva)는 **리터럴을 쓰지 않고** `bg-primary` · `rounded-control` · `duration-base` 같은 **토큰 유틸만** 소비한다.
그래서 토큰 값만 갈아끼우면 JSX 0줄 수정으로 리테마된다. SSOT 는 `packages/ui/templates/src/styles/globals.css`
(= 배포되는 `@comwit/ui-templates/styles.css` · CLI 의 `comwit-tokens.css`) **한 곳뿐이다.**

> `apps/ui-dev` · `apps/docs` · `apps/storybook` 은 전부 SSOT 를 `@import` 한다. **손복사 금지.**

### 3계층

| 레이어            | 사는 곳                      | 담는 것                                                                                                                                                                                      | 리테마 시         |
| ----------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **L0 프리미티브** | `:root` / `.dark`            | 이름 있는 팔레트(`--canvas*` · `--surface-subtle` · `--fill*` · `--ink*` · `--brand*` · `--line*` · status · `--glass-*`) + 노브(`--radius` · `--radius-scale` · `--duration-*` · `--z-*` …) | **여기만 덮는다** |
| **L1 시맨틱**     | `:root, .dark`               | `--background` · `--primary` · `--muted-foreground` · `--border` … 전부 L0 의 alias                                                                                                          | 보통 안 건드림    |
| **L2 유틸**       | `@theme inline` / `@utility` | `--color-*` → `bg-*`, `--radius-*` → `rounded-*`, `--shadow-*` → `shadow-*`, `--text-*` → 타입 스케일                                                                                        | 안 건드림         |

L0 는 유틸을 만들지 않는다(`--color-` 접두사가 없다). 컴포넌트는 역할(L1) 이름으로만 색을 부른다.

### 노브

| 노브                                                                  | 바뀌는 것                                                                                    |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--brand` · `--brand-strong` · `--brand-ink` · `--brand-surface`      | 버튼·링크·포커스 링·선택 표식 전부 (리브랜딩은 이 4개)                                       |
| `--canvas*` · `--surface-subtle` · `--fill*` · `--ink*` · `--line*`   | 면 사다리 · 텍스트 위계 · 선                                                                 |
| `--radius` · `--card-radius` · `--sheet-radius`                       | `rounded-control` / `rounded-card` / `rounded-sheet`                                         |
| `--pill-radius`                                                       | `rounded-pill` — 버튼·칩·탭바 알약                                                           |
| `--radius-scale`                                                      | 위 반경 전부 + t-shirt 사다리(`rounded-sm/md/lg…`)의 승수                                    |
| `--text-scale` · `--tracking-scale` · `--weight-*` · `--display-font` | 타입 스케일 · 자간 · 굵기 · 제목 서체                                                        |
| `--border-width(-strong)`                                             | bare/방향 보더 두께                                                                          |
| `--focus-ring-width/-offset` · `--field-ring-width`                   | 컨트롤 포커스 링(`ring-focus`) · 입력 포커스 링(`ring-field`)                                |
| `--duration-*` · `--press-scale(-thumb)` · `--ripple-opacity`         | 전환 속도 · 눌림 · 리플                                                                      |
| `--state-*`                                                           | hover/선택 헤일로 · 비활성 불투명도                                                          |
| `--elevation-*`                                                       | `shadow-xs…xl` · `shadow-card(-hover)` · `shadow-panel` · `shadow-message` · `shadow-raised` |
| `--glass-*`                                                           | 굴절 유리의 틴트·광택·그림자 (`.glass*` 가 소비)                                             |
| `--z-*`                                                               | `z-appbar` < `z-overlay` < `z-modal` < `z-dropdown` < `z-toast`                              |

`z-dropdown` 이 `z-modal` **위**인 건 의도다 — 다이얼로그·시트 안에서 연 셀렉트·메뉴·피커가 body 로 포털되므로
modal 보다 낮으면 자기를 연 다이얼로그 뒤로 숨는다.

### 소비처가 갖춰야 하는 것

```css
/* app/globals.css */
@import '@comwit/ui-templates/styles.css'; /* 토큰 + @theme inline + @utility + 유리·토스트 CSS 전부 */

/* Tailwind v4 는 node_modules 와 gitignore 된 경로를 자동 감지에서 뺀다 — 필요하면 명시한다. */
@source "../node_modules/@comwit/ui-templates/src";
```

`comwit-ui init` 이 `comwit-tokens.css` 를 프로젝트에 쓰고 이 `@import` 를 배선한다. 서체는 `--font-pretendard`
변수(next/font 등)를 `<html>` 에 두면 된다 — 없으면 시스템 서체로 떨어진다.

> **사이트 CSS 는 base 레이어에** — 소비처의 전역 요소 규칙(`button { transition }` · `:focus-visible { outline }` ·
> `h1 { font-family }`)을 unlayered 로 두면 Tailwind 유틸(레이어 안)을 이겨서 컴포넌트의 눌림 전환·포커스 링·서체가
> 조용히 바뀐다. `@layer base { … }` 로 감싸라.

### 커스터마이즈 — 라이브러리는 테마를 싣지 않는다

프리셋 테마도 `[data-theme]` 규약도 없다. **토큰만 싣고, 쓰는 쪽이 덮는다.**

```css
@import './comwit-tokens.css';

/* import 뒤에 두면 같은 특이성에서 나중 선언이 이긴다 */
:root {
  --brand: #0b68ba; /* 버튼·링크·포커스·선택 표식이 전부 */
  --brand-strong: #08528f;
  --radius-scale: 0.6; /* 모든 반경을 한 번에 */
  --pill-radius: 12px; /* 버튼·칩이 알약을 그만둔다 */
  --duration-base: 0ms; /* 모션 제거 */
}
```

스코프 커스텀은 L1(`--primary` 등)을 덮으면 그대로 먹는다. L0(`--ink` 등)를 스코프에서 덮으려면 그 셀렉터에서
L1 alias 도 다시 선언해야 한다(CSS 변수는 **선언한 요소에서** `var()` 가 치환된다). docs 의
[Tokens and theming](https://library.comwit.io/ui/theming) 에서 노브를 돌리면 붙여넣을 CSS 가 같이 나온다.

### 다크모드

`.dark` **클래스 단일 스위치**다(`light-dark()` 는 색만 커버하고 `dark:` 변형과 신호가 갈려 반쪽 다크가 난다).
`.dark` 는 L0 만 덮는다 — 면 사다리, 잉크, 브랜드 틴트, 선, status 틴트, 유리, elevation. 나머지는 alias 라 따라온다.

다크는 그림자로 depth 를 못 만든다. 그래서 면을 한 스텝씩 올려 인접 면이 항상 분리되게 하고, elevation 에 흰 inset
하이라이트를 넣는다.

```
canvas #161618 → card #1e1f22 → muted·popover #26272b → accent(hover) #2f3035 → selected #3a3b41
```

> **alias 규칙 셀렉터가 `:root, .dark` 인 이유** — `:root` 에서 `--card: var(--canvas-raised)` 가 이미 흰색으로
> 계산돼버리면 `.dark` 스코프가 L0 만 덮어도 `--card` 가 안 따라온다. 그리고 다크 전용 보정(`--skeleton` 등)은
> 반드시 alias 규칙 **뒤**에 둔다 — `html.dark` 는 두 셀렉터에 동시에 매치되고 특이성이 같다.

### 토큰 목록

**색 — `X`(면) / `X-foreground`(그 위 텍스트) 쌍.**

| 토큰                                                              | 용도                                                  | 대표 유틸                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `--background` / `--foreground`                                   | 페이지 바탕 · 제목·강조 텍스트                        | `bg-background` `text-foreground`                                            |
| `--card` · `--popover`                                            | 카드 면 · 오버레이 면                                 | `bg-card` `bg-popover`                                                       |
| `--primary` (+ `-foreground` · `-strong` · `-ink` · `-surface`)   | 지배적 액션 · hover · 틴트 면 위 텍스트 · 틴트 면     | `bg-primary` `hover:bg-primary-strong` `bg-primary-surface text-primary-ink` |
| `--soft-foreground`                                               | **제목이 아닌 기본 읽기 텍스트**                      | `text-soft-foreground`                                                       |
| `--muted-foreground`                                              | 메타·도움말 (작다고 muted 를 고르지 말 것)            | `text-muted-foreground`                                                      |
| `--subtle-foreground` · `--disabled-foreground`                   | 3차 정보·플레이스홀더 · 비활성                        | `placeholder:text-subtle-foreground`                                         |
| `--secondary` · `--muted`                                         | 옅은 면(보조 버튼·그룹 배경)                          | `bg-secondary` `bg-muted`                                                    |
| `--accent` · `--selected`                                         | **hover 면**(브랜드 아님) · 선택된 면(한 스텝 더)     | `hover:bg-accent` `bg-selected`                                              |
| `--skeleton` · `--switch-thumb` · `--overlay` · `--surface-glass` | 로딩 면 · 스위치 노브 · 모달 스크림 · 불투명 블러 칩  | `bg-skeleton` `bg-overlay`                                                   |
| `--border` · `--border-strong` · `--input` · `--ring`             | hairline · 강조 보더 · 입력 외곽 · 포커스 링(=브랜드) | `border-border` `border-input` `ring-ring`                                   |

**Status — 계열마다 5토큰**(`success` · `warning` · `destructive` · `info`). 브랜드와 무관하게 고정.
`bg-{s}` · `text-{s}-foreground` · `bg-{s}-surface` · `text-{s}-surface-foreground` · `border-{s}-border`
(+ `destructive-strong` = 위험 액션 hover). 솔리드와 그 전경은 라이트/다크가 같고, 다크는 틴트·보더만 재저작한다.

**반경** — 목적형이 주 어휘다: `rounded-control`(10 · 입력·셀렉트) · `rounded-card`(16) · `rounded-sheet`(20 · 바텀시트·토스트) ·
`rounded-pill`(버튼·칩·탭바). `rounded-full` 은 항상 원(아바타·라디오 도트·리플)이라 노브를 타지 않는다.

**타입 스케일** — `text-display-xl/lg/md/sm`(40/32/28/22 · 700) · `text-title-lg/md/sm`(18/16/14 · 600) ·
`text-body`(15) · `text-body-sm`(13) · `text-label`(14) · `text-caption`(12) · `text-micro`(11).
크기+행간+자간을 묶고 제목만 굵기를 내장한다. 색은 `text-*` 로 따로.

**이름 있는 유틸** — `ring-focus` · `ring-field` · `ring-offset-focus` · `opacity-disabled(-content)` · `scale-press(-thumb)` ·
`duration-instant/fast/base/slow/slower` · `z-raised/sticky/appbar/overlay/modal/dropdown/toast` · `state-hover-layer` ·
`state-selected-layer` · `min-w-menu` · `w-picker` · `h-appbar` · `h-bottom-nav`.

**컴포넌트 CSS**(유틸로 못 쓰는 것만) — `.glass` · `.glass-morphing/blur/frosted/fade` · `.glass-lens` · `[data-glass-item]`
(유리 메뉴 행) · `.menu-motion` · `.floating-tab-indicator` · `.comwit-toaster` · `[data-slot=editor] .tiptap`.

### 규칙과 함정

- **`cn()` 은 토큰 유틸을 알아야 한다.** `lib/utils.ts` 는 tailwind-merge 에 `text-label`·`rounded-control`·`ring-focus`
  같은 이름을 등록한다. 등록이 빠지면 `text-label text-foreground` 에서 크기가, `ring-focus ring-ring` 에서 **링 두께가**
  조용히 지워진다(= 전 컴포넌트의 키보드 포커스 링이 사라진다). `@theme`/`@utility` 에 이름을 더하면 여기도 더한다.
- **`@utility` 는 빌트인과 이름이 겹치면 조용히 버려진다.** 그래서 bare `border` 두께는 `@layer utilities` 에
  authored 규칙으로 뒤에 놓아 이긴다.
- **`@theme inline` 은 `var()` 없는 값을 리터럴로 굳힌다.** 그래서 `--radius-pill: var(--pill-radius)` 처럼 노브를 한 겹
  경유한다. `--radius-full: 9999px` 은 **일부러** 리터럴이다.
- **모션 예외** — `lib/popup.tsx` 의 confirm/alert 는 motion JS 값이라 `--duration-*` 를 안 탄다.
- **새 토큰은 두 곳을 함께**: L0/L1 값 + `@theme inline` 매핑(+ 이름 있는 유틸이면 `lib/utils.ts`).

## 배포

```bash
pnpm release:core        # @comwit/ui 빌드 후 publish
pnpm release:templates   # @comwit/ui-templates publish (workspace:* → 실버전 자동 치환)
```
