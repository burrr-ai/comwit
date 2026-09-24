# @comwit/ui

**Comwit 의 헤드리스 UI 프리미티브** — 동작·접근성(a11y)만 소유하고 **시각(스타일)은 0** 인 레이어.
Radix 처럼 "구조/동작만 있는" 프리미티브를 우리가 직접 소유·확장하기 위한 엔진이다.
스타일이 입혀진 복붙 컴포넌트는 [`@comwit/ui-templates`](https://www.npmjs.com/package/@comwit/ui-templates) 를 쓴다.

```bash
npm i @comwit/ui
# peer: react, react-dom
```

## 설계

- **공개 진입점은 배럴 하나** (`@comwit/ui`). 프리미티브는 이름 충돌을 피해 **네임스페이스**로 나간다.
  ```tsx
  import { Dialog, Select, TextField, Button } from '@comwit/ui'
  // <Dialog.Root> · <Select.Trigger> · <TextField.Root> · <Button>
  ```
- **엔진 선택 기준**: overlay/disclosure/form-control 동작 = Radix 어댑터(교체 가능), a11y 배선 = React Aria
  (`text-field`/`autocomplete` 는 `react-aria`/`react-stately` 사용 — 검증된 ARIA 를 자체 구현하지 않는다).
- **자체 헤드리스**: `Button`(press/ripple/asChild) · `Input`/`Textarea`(IME-safe) · `TextField`(MUI식 compound) · `Autocomplete`(combobox).
- **Radix 어댑터**: accordion · avatar · collapsible · dialog · dropdown-menu · label · popover · select · separator · tabs · checkbox · radio-group · switch.

## ⚠️ Tailwind 토큰 결합 (오버라이드 지점)

이 패키지는 **원칙적으로 스타일이 없지만**, 인터랙션/모션 유틸 두 곳은 Tailwind 클래스 문자열에 얇게 결합돼 있다.
소비 레이어가 자유롭게 **오버라이드/교체**할 수 있도록 아래를 명시한다:

| export                                                          | 결합된 것                                                                        | 오버라이드                                    |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- |
| `focusRing`, `pressable`, `disabledStyle` (`utils/interaction`) | 포커스 링·눌림·비활성 **Tailwind 클래스 상수** (`--ring`, `--color-*` 토큰 참조) | 상수를 import 하지 않고 자체 클래스를 쓰면 됨 |
| `useRipple` / `<Button>` (`utils/ripple`)                       | 리플 컨테이너의 `relative overflow-hidden` **구조 클래스**                       | `<Button disableRipple>` 또는 `asChild` 로 끔 |

즉 **색/토큰 계약**(`--ring`, `--primary`, `--color-*` …)은 소비처(Tailwind 테마)가 소유한다.
프리미티브는 그 토큰을 _참조만_ 하므로, 테마 값만 바꾸면 전체가 리테마된다.
표준 토큰 세트는 `@comwit/ui-templates` 의 `styles/globals.css` 를 참고/복사한다.

## 로드맵

- [ ] Radix re-export 를 프리미티브 단위로 자체 구현 교체 (dialog → popover → …)
- [ ] 각 프리미티브 개별 서브패스 export
