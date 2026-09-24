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

컴포넌트(cva)는 **리터럴을 절대 쓰지 않는다.** `bg-primary` · `rounded-md` · `duration-base` 같은 **Tailwind
유틸리티만** 소비하고, 그 유틸리티는 CSS 변수 + `@theme inline` 매핑에서 생성된다. 그래서 **토큰 값만 갈아끼우면
JSX 0줄 수정으로 리테마**된다. SSOT 는 `packages/ui/templates/src/styles/globals.css`
(= 배포되는 `@comwit/ui-templates/styles.css`) **한 곳뿐이다.**

> `apps/ui-dev` · `apps/docs` · `apps/storybook` 은 전부 SSOT 를 `@import` 한다. **손복사 금지** —
> 예전엔 globals.css 를 앱마다 복제해서 갈라질 위험이 있었다. 앱은 `@source` 두 줄만 추가한다.

### 3계층

| 레이어        | 사는 곳                               | 담는 것                                                                                                                         | 리테마 시         |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **L0 노브**   | `:root` / `.dark` / 소비처 오버라이드 | 뉴트럴 램프 `--n-1..12` + 고수준 다이얼(`--radius-scale` · `--border-width` · `--elevation-*` · `--duration-*` · `--state-*` …) | **여기만 덮는다** |
| **L1 시맨틱** | 〃                                    | `--background` · `--primary` · `--border` … 역할 토큰. 대부분 램프의 alias                                                      | 보통 안 건드림    |
| **L2 유틸**   | `@theme inline` / `@utility`          | `--color-*` → `bg-*`, `--radius-*` → `rounded-*`, `--shadow-*` → `shadow-*` … **유틸명이 여기서 확정**                          | 안 건드림         |

램프(`--n-*`)는 **유틸을 만들지 않는다**(`--color-` 접두사가 없다). raw 색을 컴포넌트가 직접 못 쓰게 하는 구조적 차단이다.

### 노브 하나가 어디까지 번지나

실측(`packages/ui/templates/src` 기준). 값 하나 바꾸면 아래 전부가 따라온다.

| 노브                                               | 바뀌는 것                                    | 영향 유틸 | 파일 |
| -------------------------------------------------- | -------------------------------------------- | --------- | ---- |
| `--n-1..12`                                        | 색 **전부**(면·텍스트·보더·링)               | 261곳     | 30   |
| `--radius-scale`                                   | `rounded-xs/sm/md/lg/xl/2xl/3xl` 곱셈 사다리 | 49곳      | 25   |
| `--border-width`                                   | bare `border` + 방향 보더                    | 41곳      | 24   |
| `--weight-*` · `--text-scale` · `--tracking-scale` | 타입 프리셋 + `font-*` 웨이트                | 44곳      | 10   |
| `--state-disabled`                                 | 비활성 불투명도 (`opacity-disabled`)         | 24곳      | 17   |
| `--duration-*`                                     | 전환 속도 (`duration-base` …)                | 18곳      | 8    |
| `--z-*`                                            | 레이어링 사다리 (`z-dropdown` · `z-modal` …) | 18곳      | 12   |
| `--elevation-0..5,raised`                          | `shadow-xs/sm/md/lg/xl/raised/card`          | 17곳      | 15   |
| `--pill-radius`                                    | 알약(칩·캘린더 셀·스위치)                    | 13곳      | 7    |
| `--focus-ring-width/-offset`                       | 포커스 링 (`ring-focus`)                     | 9곳       | 6    |
| `--ease-standard/-emphasized`                      | 이징 커브                                    | 7곳       | 6    |
| `--menu-min-width` · `--picker-width`              | 메뉴/피커 폭 정합                            | 6곳       | 4    |
| `--state-hover` · `--state-selected`               | 체크박스·라디오 헤일로                       | 4곳       | 2    |
| `--display-font`                                   | dialog/sheet/card/alert **제목만** 세리프화  | 4곳       | 4    |
| `--press-scale` · `--press-scale-thumb`            | 눌림 스케일                                  | 2곳       | 2    |

`--primary` 하나만 바꾸면 버튼·링크·포커스·선택 표식이 전부 따라온다. 솔리드 hover(`bg-primary/90`)는
`color-mix` 라 자동 추종한다.

### 소비처가 갖춰야 하는 것

```css
/* app/globals.css */
@import '@comwit/ui-templates/styles.css'; /* 토큰 + @theme inline + @utility 전부 */

/* Tailwind v4 는 node_modules 를 기본 제외한다. 컴포넌트를 src 에 복붙했다면 생략 가능. */
@source "../node_modules/@comwit/ui-templates/src";
```

`comwit-ui init` 이 `comwit-tokens.css` 를 프로젝트에 쓰고 이 `@import` 를 배선한다.

### 커스터마이즈 — 라이브러리는 테마를 싣지 않는다

프리셋 테마도, `[data-theme]` 같은 규약도 없다. **토큰만 싣고, 쓰는 쪽이 덮는다.**

```css
@import '@comwit/ui-templates/styles.css';

/* import 뒤에 두면 같은 특이성에서 나중 선언이 이긴다 */
:root {
  --primary: #0b68ba; /* 브랜드 하나만 바꿔도 버튼·링크·포커스·선택 표식이 전부 */
  --radius-scale: 0; /* 전 컨테이너 직각 */
  --border-width: 2px; /* bare/방향 보더 일괄 */
  --duration-base: 0ms; /* 모션 제거 */
  --n-2: #f4f6f8; /* 램프를 갈면 secondary/muted/card 가 통째로 따라온다 */
}
```

스코프 커스텀도 셀렉터 하나면 된다. 시맨틱·노브 토큰은 `var()` 가 **사용처에서** 치환되므로 어떤 셀렉터에서
덮어도 먹는다. 단 램프(`--n-*`)를 스코프에서 덮으려면 그 셀렉터에서 시맨틱 alias 도 다시 선언해야 한다
(아래 다크모드 설명 참고).

ui-dev 카탈로그의 **Override Lab**(섹션 01)이 이걸 그대로 시연한다 — 노브를 돌리면 붙여넣을 CSS 가 같이 나온다.

### 다크모드

`.dark` **클래스 단일 스위치**다. `light-dark()` 는 쓰지 않는다 — 그건 색만 커버하는데 `dark:` 변형은
기본이 미디어 쿼리라 두 신호가 갈려 **반쪽 다크**가 난다.

```html
<html class="dark">
  <!-- 전역 -->
  <div class="dark">…</div>
  <!-- 중첩도 가능 -->
</html>
```

`.dark` 는 램프 12값 + status surface/보더 + elevation + 선 색만 덮는다. 나머지는 alias 라 자동으로 따라온다.

> **왜 alias 규칙 셀렉터가 `:root, .dark` 인가**
> CSS 커스텀 프로퍼티는 **선언한 요소에서** `var()` 가 치환된다. `:root` 에서 `--card: var(--n-1)` 이 이미
> 흰색으로 계산돼버리면, 자식이 `--n-1` 만 덮어도 `--card` 는 안 따라온다. 그래서 램프를 덮는 스코프마다
> alias 도 다시 선언한다.
>
> **그래서 순서가 중요하다.** `html.dark` 는 `.dark` 와 `:root` 에 **동시에** 매치되고 둘 다 특이성 (0,1,0) 이다.
> 다크 전용 시맨틱 보정(`--card`·`--input` …)은 반드시 alias 규칙 **뒤**에 와야 한다. 앞에 두면 alias 가
> 되돌려버린다 — 실제로 겪었다.

다크는 그림자로 depth 를 못 만든다(검정 그림자가 근검정 배경 위에서 안 보임). 그래서 `--card`→`n-2`,
`--popover`→`n-3` 로 **톤을 올리고**, elevation 에 흰 inset 하이라이트를 넣는다.

**다크 면 사다리** — 라이트에선 카드가 흰색(n-1)이라 `muted`/`secondary` 를 n-2 로 둬도 떠 보인다. 다크에선
카드가 n-2 라 그대로 두면 **대비 1.00:1 로 사라진다**(테이블 헤더·탭 리스트·스켈레톤·행 press 가 전부 카드 안에
놓인다). 그래서 다크에선 한 스텝씩 올려 인접 스텝이 항상 분리되게 한다.

```
background n-1  →  card n-2  →  muted·secondary·popover n-3  →  accent(hover) n-4  →  selected n-5
```

### 토큰 목록

**색 — `X`(면) / `X-foreground`(그 위 텍스트) 쌍.** cva 는 `bg-X` + `text-X-foreground` 로 항상 짝지어 쓴다.

| 토큰 쌍                                  | 용도                                                    | 대표 유틸리티                      |
| ---------------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| `--background` / `--foreground`          | 페이지 바탕·본문 텍스트                                 | `bg-background` `text-foreground`  |
| `--card` / `--card-foreground`           | 카드 면 (다크는 배경 위로 톤 상승)                      | `bg-card`                          |
| `--popover` / `--popover-foreground`     | 오버레이 면 (카드 위로 한 톤 더)                        | `bg-popover`                       |
| `--primary` / `--primary-foreground`     | **지배적 액션**(기본 컴윗 블루)                         | `bg-primary`                       |
| `--soft-foreground`                      | 읽어야 하는 회색 본문·긴 설명                           | `text-soft-foreground`             |
| `--secondary` / `--secondary-foreground` | 보조 버튼·섹션 면                                       | `bg-secondary`                     |
| `--muted` / `--muted-foreground`         | muted 면 · 보조 텍스트                                  | `bg-muted` `text-muted-foreground` |
| `--subtle-foreground`                    | 3차 정보·플레이스홀더                                   | `text-subtle-foreground`           |
| `--disabled-foreground`                  | 비활성 텍스트·아이콘                                    | `text-disabled-foreground`         |
| `--accent` / `--accent-foreground`       | **hover 채움 면**(브랜드색 아님)                        | `bg-accent`                        |
| `--selected`                             | **선택된 면** — hover 보다 한 스텝 더(Radix step5)      | `bg-selected`                      |
| `--skeleton`                             | 로딩 플레이스홀더 전용면                                | `bg-skeleton`                      |
| `--placeholder`                          | 플레이스홀더 (구 `muted-foreground/60` = 2.6:1 → 4.7:1) | `placeholder:text-placeholder`     |
| `--switch-thumb`                         | 스위치 노브 **전용** — 트랙 대비 유지                   | `bg-switch-thumb`                  |
| `--overlay`                              | 모달 스크림 (구 raw `bg-black/50`)                      | `bg-overlay`                       |
| `--surface-glass`                        | backdrop-blur 칩                                        | `bg-surface-glass`                 |

**Status — 계열마다 5토큰**(`success` · `warning` · `destructive` · `info`). 브랜드와 무관하게 고정.
**솔리드(step9)와 그 전경은 라이트/다크가 같다**(Radix 규약). 다크에서 재저작하는 건 `surface` · `surface-foreground` · `border` 뿐이다 — 솔리드를 밝히면 그 위 흰 전경 대비가 오히려 떨어진다.

| 슬롯                                               | 예시                | 용도                            |
| -------------------------------------------------- | ------------------- | ------------------------------- |
| `--{tone}` / `--{tone}-foreground`                 | `--success`         | solid 면 / 그 위 텍스트         |
| `--{tone}-surface` / `--{tone}-surface-foreground` | `--success-surface` | 틴트 면 / 그 위 텍스트(AA)      |
| `--{tone}-border`                                  | `--success-border`  | 틴트 보더(다크는 카드 대비 3:1) |

**선 · 반경 · 그림자 · 폰트**

| 토큰                                      | 용도                                             |
| ----------------------------------------- | ------------------------------------------------ |
| `--border` / `--border-strong`            | hairline 디바이더 / 강조 보더                    |
| `--input` / `--input-hover`               | 입력 외곽 / hover (다크는 램프 두 스텝 위)       |
| `--ring`                                  | 포커스 링 색 (라인색과 분리)                     |
| `--radius-scale` / `--pill-radius`        | 곱셈 사다리 승수 / 알약                          |
| `--elevation-0..5` / `--elevation-raised` | 컨테이너 그림자 / **소형 요소 전용**(썸·활성 탭) |
| `--display-font`                          | 제목 폰트. `[data-slot$="-title"]` 가 자동 상속  |

**타입 스케일** — `text-display-xl/lg/md/sm` · `text-title-lg/md/sm` · `text-body(-sm)` · `text-label` · `text-caption` · `text-micro`.
크기+행간+자간+굵기를 묶은 목적형 유틸(색은 `text-foreground` 등으로 별도). 굵기는 `--weight-*`, 자간은
`--tracking-scale`, 크기는 `--text-scale` 노브를 탄다.

**이름 있는 유틸**(`@utility`) — 컴포넌트에 arbitrary 를 흩뿌리지 않기 위한 것.
`opacity-disabled` · `ring-focus` · `ring-offset-focus` · `scale-press(-thumb)` · `duration-instant/fast/base/slow/slower` ·
`z-raised/sticky/dropdown/overlay/modal/toast` · `state-hover-layer` · `state-selected-layer` · `min-w-menu` · `w-picker`.

### 규칙과 함정

- **`rounded-full` vs `rounded-pill`** — `full` = 항상 원(아바타·라디오 도트·리플). `pill` = 테마가 각지게
  만들 수 있는 알약(칩·캘린더 셀). 하나로 묶으면 `--radius-scale: 0` 을 주는 순간 라디오가 **사각형**이 된다.
- **`@utility` 는 빌트인과 이름이 겹치면 조용히 버려진다.** `@utility border {…}` 는 무시된다(실측 확인).
  그래서 bare `border` 두께는 `@layer utilities` 에 authored 규칙으로 뒤에 놓아 이긴다. variant 가 붙는
  두께(`group-data-[…]:border-2`)는 이 방식으로 못 덮으니 `border-[length:var(--border-width-strong)]` 로 쓴다.
- **`@theme inline` 은 `var()` 없는 값을 리터럴로 굳힌다.** `--radius-pill: 9999px` 로 두면 테마가 못 덮는다.
  그래서 `--radius-pill: var(--pill-radius)` 로 노브를 한 겹 경유한다. 반대로 `--radius-full: 9999px` 는
  **일부러** 리터럴로 둬서 어떤 테마도 못 바꾸게 한다.
- **모션 예외** — `lib/popup.tsx` 는 framer-motion JS 값이라 `--duration-*` 를 안 탄다(`dialog.tsx` 는 CSS 애니라 정상).
- **새 토큰을 추가할 땐 두 곳을 함께**: `:root` 에 원시 값 + `@theme inline` 에 `--color-*`(또는 스케일) 매핑.
  둘 중 하나만 있으면 유틸이 안 생기거나(매핑 누락) 빈 값이 된다(원시값 누락).
  램프를 덮는 새 스코프를 만들면 **L1 alias 규칙 셀렉터에도 추가**해야 한다.

## 배포

```bash
pnpm release:core        # @comwit/ui 빌드 후 publish
pnpm release:templates   # @comwit/ui-templates publish (workspace:* → 실버전 자동 치환)
```
