# TODO

comwit-ui 작업 모음. 정한 것 · 만들 것 · 아이디어를 여기 쌓는다. (자유롭게 계속 추가)

---

## ✅ 결정 (Decisions)

- **autocomplete 이름 유지** — `combobox`(shadcn 네이밍)로 안 바꾼다. react-aria 기반 우리 구현.
- **chip 방향** — `badge`(정적 토큰) 대신 `chip`(ripple/removable)을 메인으로. badge 흡수/대체 검토.
- **separator · label** — core 프리미티브 없이 템플릿 자립(behavior 0이라 토큰뿐). `avatar`는 로딩 behavior 있어 core 유지.
- **레이어 계약** — core(`@comwit/ui`) = 스타일 0 headless(behavior/a11y·react-aria는 내부 엔진), templates = 파트 조립 + className 토큰.
- **토큰 v2 (3계층)** — L0 노브(뉴트럴 램프 12단 + radius-scale·border-width·elevation·duration·state…) → L1 시맨틱 alias → L2 `@theme inline` 유틸. 리테마는 **L0만** 덮는다.
- **다크는 `.dark` 클래스 단일 스위치** — `light-dark()` 안 씀(색만 커버 + `dark:` 변형과 desync). `@custom-variant dark (&:is(.dark *))`.
- **`rounded-full` vs `rounded-pill`** — full = 항상 원(아바타·라디오 도트·리플), pill = 소비처가 각지게 가능(칩·캘린더셀). 하나로 묶으면 `--radius-scale: 0` 에서 라디오가 사각형이 된다.
- **SSOT 1벌** — 앱들이 `@import "@comwit/ui-templates/styles.css"` 한다. 손복사 금지.
- **컴포넌트에 arbitrary 금지** — 토큰을 참조할 땐 `opacity-[var(--state-disabled)]` 같은 표기 대신 `@utility` 로 이름 붙인 유틸(`opacity-disabled` · `ring-focus` · `duration-base` · `shadow-card` · `min-w-menu` …)을 쓴다. variant 가 붙는 두께(`group-data-[…]:border-[length:var(--border-width-strong)]`)처럼 `@utility` 로 감쌀 수 없는 것만 예외.

---

## 🔨 만들 것 — shadcn엔 있는데 우리에겐 없음 (갭)

우선순위는 나중에. 후보만 모음:

- [ ] alert-dialog
- [ ] breadcrumb
- [ ] button-group
- [ ] command (⌘K 팔레트)
- [ ] context-menu
- [ ] drawer (vaul식 — 우리 sheet와 구분)
- [ ] hover-card
- [ ] input-otp
- [ ] menubar
- [ ] navigation-menu
- [ ] progress
- [ ] scroll-area
- [ ] sidebar
- [ ] slider
- [ ] spinner
- [ ] toggle / toggle-group
- [ ] tooltip
- [ ] 기타: aspect-ratio · carousel · chart · resizable · empty · kbd · item · native-select
- 참고: `combobox` ≈ 우리 autocomplete / `field` ≈ 우리 text-field (개념 중복) / `toast`는 sonner로 대체됨 → 스킵

---

## 🟣 우리 독자 컴포넌트 (shadcn 밖)

### 추가로 만들 것

- [x] AppBar — flow / pinned / reveal + 유리 뒤로가기 · FloatingBackButton(hero)
- [x] BottomNav — 플로팅 유리 캡슐 · 스프링 인디케이터 · 스크롤 compact
- [ ] SmartSelect — 선택 UI (모바일에선 바텀시트로 뜨는 Select)
- [x] Toast — sonner 유리 토스트(모바일 상단 · 데스크톱 우하단)
- [x] PopupSheet — `popup.sheet()` (피커 3종이 모바일에서 사용)
- [x] Sheet — 기본 시트 컴포넌트
- [ ] InfiniteScroll — 컴윗 피드의 IntersectionObserver 센티넬(rootMargin 600px)을 훅으로 추출
- [x] PullToRefresh · DragScroller · SegmentedControl · Pager · EmptyState · Glass(굴절 유리) — 컴윗에서 이식

| 컴포넌트     | 상태 | 메모                                                |
| ------------ | ---- | --------------------------------------------------- |
| autocomplete | 유지 | 이름 확정. shadcn combobox 대응                     |
| chip         | 메인 | badge 대신 밀기                                     |
| text-field   | 유지 | 컴윗식 라벨 고정 하나(MUI 플로팅/노치 variant 제거) |
| editor       | 유지 | tiptap 리치텍스트                                   |
| month-picker | 유지 |                                                     |
| time-picker  | 유지 |                                                     |

---

## 📚 Docs — ✅ 1차 구축 완료 (`apps/docs`)

- [x] Next 16 + Tailwind 4 docs 앱. `scripts/gen-ui.mjs` 가 gallery.mjs + specs + registry + 토큰 CSS 로 카탈로그 생성(파트·토큰은 소스에서 자동 추출).
- [x] **스크롤 갤러리** `/ui/components` — 44종을 용도별 7그룹 한 장에. 모바일 앱(폰 프레임) → 유리 → 알림 → 피커 → 선택 → 폼·데이터 → 기본형(견본지). Code 는 시트로(예시·복붙 코드·CLI·소스). 컴포넌트별 페이지는 앵커로 리다이렉트.
- [x] **토큰 & 테마** — 토큰 편집 시 라이브 전파(색 바꾸면 컴포넌트+문서UI 즉시 반영) + 토큰→컴포넌트 의존맵
- [x] **OpenNext → Cloudflare** 셋업(`open-next.config.ts`·`wrangler.jsonc`·`pnpm --filter docs deploy`)
- [ ] **배포 실행** — `cd apps/docs && pnpm deploy` (Cloudflare 계정 로그인 `wrangler login` 필요 — 내 환경에선 인증 불가라 미실행)
- [x] **다크모드 토큰 세트** — `.dark` 클래스 단일 스위치로 완료(토큰 v2)
- [x] 검색(⌘K) · 스크롤스파이 · 모바일 내비 시트 · docsOnly 스펙으로 폴백 예시 대체 · 예시 전부 영어
- [x] docs 토큰 파서(`scripts/gen.mjs`) 토큰 v2 대응 — 86토큰 · 라이트/다크 동시 · 램프 비노출 · alias 를 hex 로 해석
      (※ 옛 파서는 `css.split('@theme')[0]` 이라 **주석에 "@theme" 이라는 글자만 있어도 토큰 0개**가 됐다)
- [x] `/ui/theming` — 라이트/다크 스와치 나란히 · 프리미티브→시맨틱→컴포넌트 의존 · ThemeEditor 에 팔레트+노브+다크 토글+붙여넣을 CSS

---

## 🗒️ 기타 / 모아둘 것

### 토큰 v2 — 알려진 노브 예외 (후속)

- [ ] `lib/popup.tsx` 오버레이/시트 모션이 framer-motion JS 값(0.15s·0.18s)이라 `--duration-*` 를 안 탄다. dialog.tsx 처럼 CSS 애니로 옮기거나 JS 쪽에 토큰 주입.
- [ ] 장식적 `opacity-50` 3곳(select·autocomplete 셰브론, calendar 네비) — 비활성 상태가 아니라 흐림 표현이라 `--state-*` 로 안 묶었다. 필요하면 `--state-muted` 신설.
- [ ] shadcn 잔재 `dark:` 변형 7곳(tabs 4 · badge 3)이 토큰 대신 알파 리터럴을 쓴다(`dark:bg-input/30` 등). 이제 같은 `.dark` 스위치를 물어 동작은 정상.
- [ ] 컴윗 기준 재정렬은 **breaking change** 다(칩 variant·tone 이름, TextField props, 램프 제거, 포커스 링 2px). 0.x 범프 + 마이그레이션 노트 필요.
- [ ] Autocomplete — invalid 가 보더만 바꾼다(에러 문구 슬롯 없음) · `AutocompleteSection` 제목 스타일 없음.
- [ ] core `rich-text` 가 아직 `prose` 클래스를 방출한다(typography 플러그인 전제) — 본문 스타일은 이제 styles.css 가 대신한다.
- [ ] Pagination(조립형) 과 Pager(page/totalPages) 가 공존 — 하나로 합칠지 결정.
- [ ] 다크모드 유리(`--glass-*` 다크값)는 실사진 위 시각 QA 가 더 필요.

- (여기에 계속 추가)

---

## 🧾 완료 (참고 — 최근 세션)

- **컴윗 디자인 시스템을 기본값으로** — 토큰을 컴윗 `globals.css` 기준으로 재구성: 램프 `--n-*` 제거 → 이름 있는 팔레트
  (`--canvas*` · `--surface-subtle` · `--fill*` · `--ink*` · `--brand*` · `--line*`), 목적형 반경(`rounded-control/card/sheet/pill`),
  `shadow-panel/message`, 굴절 유리(`.glass*` · `--glass-*`), 유리 토스트, 메뉴 모션. 템플릿 전부를 컴윗 `src/lib/components/ui` 기준으로 재이식.
- 🐛 **`cn()` 이 포커스 링을 지우고 있었다** — tailwind-merge 가 `ring-focus` 를 링 색으로 오인해 `ring-ring` 옆에서 삭제 →
  **전 컴포넌트 키보드 포커스 링 0px**. `text-label`·`text-caption` 도 글자색 옆에서 지워졌다. `extendTailwindMerge` 로 토큰 등록.
- 🐛 `z-dropdown`(1000) < `z-modal`(1200) 이라 다이얼로그 안 셀렉트·메뉴·피커가 다이얼로그 뒤로 숨었다 → dropdown 을 modal 위로.
- 🐛 ScrollChrome — passive 휠이 먼저 스크롤한 뒤 핸들러가 기준점을 다시 읽어 한 칸짜리 휠 입력이 사라지던 것 수정.
- 🐛 docs — 사이트의 unlayered 요소 규칙(`button{transition}` · `:focus-visible{outline}` · `h1{font}` · Inter `--font-sans` 덮어쓰기)이
  라이브러리 유틸을 이겨 docs 안 컴포넌트가 실제와 달랐다 → base 레이어로 · 폰트 덮어쓰기 제거.
- Label 이 Checkbox/Radio 옆에서 비활성을 못 따라가던 것(`peer-has-[:disabled]`) · 삭제 칩 disabled/키보드 · Pagination disabled/라벨 ·
  TextField 이중 흐림 · Switch 이름 있는 group · Editor 플레이스홀더/a11y 속성 · 피커 `locale`/`labels` + MonthPicker 모바일 시트.

- **data-table** 이식(base-template → templates). TanStack Table · 서버 페이지네이션 · 스켈레톤 + 빈행 패딩 · 재조회 스피너. `ColumnDef` 재수출.
- **디자인 토큰 v2** — 3계층(L0 노브 / L1 시맨틱 / L2 유틸) 재설계 + 35개 컴포넌트 전파(104곳) + 다크모드
  - 신설 토큰: 램프 `--n-1..12` · `--radius-scale` · `--pill-radius` · `--text-scale` · `--tracking-scale` · `--border-width(-strong)` · `--elevation-0..5,raised` · `--duration-*` · `--press-scale(-thumb)` · `--state-*` · `--z-*` · `--placeholder` · `--switch-thumb` · `--overlay` · `--surface-glass` · `--border-strong` · `--input-hover` · `--display-font`
  - `--disabled-foreground`는 텍스트 시멘틱 재정립으로 복구·소비처 연결, `--radius`는 폐기
  - 함정 기록: `@utility` 는 빌트인과 이름이 겹치면 **조용히 버려진다** → bare `border` 두께는 `@layer utilities` authored 규칙으로 덮음. `@theme inline` 은 `var()` 없는 값을 **리터럴로 굳혀** 테마가 못 덮는다 → `--radius-pill` 은 `--pill-radius` 노브 경유.
- ui-dev 카탈로그에 **Foundations + Override Lab** 추가 — 래퍼에 CSS 변수만 꽂아 전 섹션 리스킨 증명(소비처 모델 그대로)
- **테마 프리셋 · `[data-theme]` 규약 제거** — 라이브러리는 의견을 싣지 않는다. 다양성은 노브에서 나온다.
- 🐛 다크 `--input`/`--ring` 오버라이드가 alias 규칙보다 **앞**에 있어 되돌려지고 있었음 → alias 뒤로 이동
- **Astryx 정밀 독해 후 격차 3건 반영** (`facebook/astryx` 소스 직독 + 팩트체크로 주장 4건 반증)
  - `--selected`(n-5) 신설 — hover 와 selected 가 둘 다 `bg-accent` 라 **픽셀이 같았다**. 죽어있던 램프 n-5 회수 → 12단 전부 소비
  - 다크 `--muted`/`--secondary` → n-3 — 카드(n-2) 안에서 대비 1.00:1 로 사라지던 테이블 헤더·탭 리스트·행 press 복구
  - `--skeleton` 신설 (라이트 n-3 / 다크 n-4) — 스켈레톤이 `bg-muted`·`bg-secondary` 두 갈래였고 둘 다 다크에서 소멸
  - 기각: property-first 재명명(`--color-text-primary`) · `light-dark()` · 컴포넌트 계층 토큰(빌드타임 컴파일 필요) · `--color-track`(소비처 없음)
  - 보류: `--size-element-*`(컨트롤 높이) · 4번째 면 `--surface-raised`

- core 프리미티브 20종 **컴파운드 패턴 전수감사** → 리팩토링
- 소형 픽스: collapsible `'use client'`(RSC 크래시) · radio-group null 타입 · select/collapsible 내부 displayName
- **text-field** aria-describedby 견고화(child-scan ∪ 마운트 등록) · **autocomplete** 풀 컴파운드화(react-aria 내부 엔진)
- **separator · label** core 제거 → 템플릿 자립
- storybook 토큰-only 스토리 6개 제거(separator·label·alert·badge·card·skeleton)
- 루트 스크립트 정리(`pnpm dev` / `storybook` / `dev:core` / …)
