# comwit-ui

**Comwit UI 컴포넌트 설치 CLI.** shadcn 의 "복붙해서 소유" 철학에서 **영감**만 받은, comwit 자체 도구다 —
shadcn CLI·registry 스키마·`components.json` 에 의존하지 않는다. 레지스트리를 **패키지에 번들**로 싣고 다니므로
`npx comwit-ui` 만으로 오프라인에서도 동작한다.

```bash
npx comwit-ui@latest init          # 프로젝트 세팅 (comwit.json + 토큰 계약)
npx comwit-ui@latest add button    # 컴포넌트 + 의존 설치
```

## 명령어

|                           | 하는 일                                                                         |
| ------------------------- | ------------------------------------------------------------------------------- |
| `comwit-ui init`          | `comwit.json` 생성 + `comwit-tokens.css`(토큰 계약) 배선 + 베이스 npm deps 설치 |
| `comwit-ui add <name...>` | 컴포넌트 + `registryDependencies`(형제/lib/hook) + npm `dependencies` 설치      |
| `comwit-ui list`          | 설치 가능한 컴포넌트 목록                                                       |

**플래그**: `--cwd <dir>` 대상 프로젝트 · `--overwrite` 기존 파일 덮기 · `--dry` 미리보기(안 씀) ·
`--no-install` npm 설치 스킵 · `--css <path>` 전역 CSS 경로 지정 ·
`--router <nextjs|react-router|tanstack-router|generic>` 라우터 종속 구현체(`route-boundary`)를 직접 지정

## 동작 방식

1. **컴포넌트 파일 복사** — `components/ui/<name>.tsx` 를 내 프로젝트로. 이제 내 코드, 자유 수정.
2. **`registryDependencies` 재귀 해석** — 예: `add date-picker` → `popover`·`popup`·`use-mobile`·`interaction`·`utils` 까지 자동.
3. **import 경로 재작성** — 템플릿의 상대 import(`../../lib/utils` · `./popover` · `../../hooks` …)를 내
   `comwit.json` 의 `importAlias`+`aliases` 로 치환(`@/lib/utils` · `@/components/ui/popover` · `@/hooks/use-mobile`).
   `@comwit/ui`(엔진)는 그대로 npm 참조.
4. **npm `dependencies` 설치** — `@comwit/ui` 및 `class-variance-authority`·`lucide-react`·(해당 시)
   `react-hook-form`·`@tiptap/*`·`sonner`·`@ssgoi/react`·`react-virtuoso` 등. 패키지 매니저(pnpm/yarn/bun/npm) 자동 감지.
5. **라우터 감지 변형** — `variants` 가 있는 아이템(`route-boundary`)은 `package.json` 의 `next` ·
   `react-router(-dom)` · `@tanstack/react-router` 를 보고 맞는 구현체를 쓴다(없으면 generic). 프레임워크 패키지는
   이미 있으므로 설치 목록에 넣지 않는다. `--router` 로 강제할 수 있고, `comwit-ui list` 가 변형 목록을 보여준다.

## `comwit.json`

```json
{
  "aliases": { "ui": "components/ui", "lib": "lib", "hooks": "hooks" },
  "css": "app/globals.css",
  "importAlias": "@/"
}
```

- `aliases` — 파일이 놓일 위치. `add` 가 이 경로로 복사한다.
- `css` — 전역 CSS. `init` 이 여기에 `@import "./comwit-tokens.css"` 를 (tailwind import 뒤에) 배선한다.
- `importAlias` — 재작성된 import 접두사(`@/`). 프로젝트 tsconfig `paths` 와 맞춘다.

## 토큰 계약

`init` 이 `comwit-tokens.css` 를 CSS 옆에 쓰고 `@import` 한다 (SSOT `@comwit/ui-templates/styles.css` 에서 생성).
안에는 뉴트럴 램프 `--n-1..12` · 시맨틱 색 · 타입스케일 · radius/border/elevation/motion/state/z 노브 ·
`.dark` 다크 세트 · `@theme inline` 매핑 · `@utility`(z-_, state-_-layer, ring-focus …) 가 전부 들어있다.
`tw-animate-css` 는 함께 설치된다.

**프리셋 테마는 배포하지 않는다.** 커스터마이즈는 소비처가 값을 덮어서 한다 — 토큰 뒤에 쓰면 이긴다.

```css
@import 'tailwindcss';
@import './comwit-tokens.css';

:root {
  --brand: #0b68ba; /* 컴윗 블루 기본값을 교체 */
  --brand-strong: #095a9d;
  --brand-ink: #073b67;
  --brand-surface: #e6f4fe;
  --radius-scale: 0; /* 성격은 L0 노브로: 직각 */
  --border-width: 2px; /* 굵은 보더 */
  --duration-base: 0ms; /* 모션 제거 */
}
```

다크는 `<html class="dark">` 하나. 컴포넌트 코드는 0줄 변한다.

전체 토큰 표와 "노브 하나가 어디까지 번지나"는 [루트 README 의 토큰 계약](../../README.md#토큰-계약-테마--커스터마이징) 참고.

## 레지스트리 재생성 (개발자용)

컴포넌트/variant 를 고치면 번들 레지스트리를 다시 뽑는다(모노레포에서):

```bash
pnpm registry        # = comwit-ui build:registry — templates 소스 → packages/ui/cli/registry/*.json
```
