# @comwit/ui-templates

**Comwit UI 의 스타일 레이어** — [`@comwit/ui`](https://www.npmjs.com/package/@comwit/ui) 헤드리스 엔진 위에
Tailwind 토큰 + `cva` variant 로 **시각만** 입힌 컴포넌트.

배포 철학은 **shadcn 에서 영감(inspired)만** 받았다 — "스타일 컴포넌트를 블랙박스 패키지로 설치하는 게 아니라
소스를 내 프로젝트로 가져와 **소유·수정**한다". 단 **shadcn 툴엔 의존하지 않는다**. 설치는 comwit 자체 CLI
**[`comwit-ui`](../cli)** 로 한다(수동 복붙 아님 — shadcn 처럼 CLI 를 배포한다).

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
[sonner](https://sonner.emilkowal.ski/) 를 쓴다. 앱 루트에 한 번 마운트한다:

```tsx
'use client'
import { OverlayProvider } from 'overlay-kit'
import { Toaster } from '@/components/ui/sonner' // sonner 컴포넌트도 add 대상

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OverlayProvider>
      {children}
      <Toaster />
    </OverlayProvider>
  )
}
```

## 사용

```tsx
import { Button } from '@/components/ui/button' // CLI 가 복사한 경로

;<Button variant="secondary" size="lg">
  저장
</Button>
```

동작·a11y·IME·포커스·달력/시간 로직은 전부 `@comwit/ui`(엔진)가 소유하고, 이 파일은 cva 로 **시각/variant 만** 입힌다.
그래서 컴포넌트를 열어 Tailwind 클래스를 마음대로 고쳐도 동작은 안 깨진다.

## 컴포넌트 (34)

accordion · alert · autocomplete · avatar · badge · button · calendar · card · checkbox · chip ·
collapsible · date-picker · dialog · dropdown-menu · editor · form · input · input-group · label ·
month-picker · pagination · popover · radio-group · select · separator · sheet · skeleton · sonner ·
switch · table · tabs · text-field · textarea · time-picker

공용: `lib/utils` · `lib/interaction`(focusRing 등) · `lib/popup`(overlay-kit 래퍼) · `hooks/use-mobile`

> 카탈로그(`apps/ui-dev`, http://localhost:3007)와 스토리북(`apps/storybook`, http://localhost:6008)에서
> variant별로 미리 볼 수 있다.
