/**
 * comwit-ui — 컴윗 자체 헤드리스 UI 프리미티브 (radix식 · 향후 독립 라이브러리)
 *
 * 이 배럴이 **유일한 공개 진입점**이다. 다른 곳(lib/components/ui, admin/ui …)에서
 * 프리미티브를 쓸 땐 반드시 `@comwit-ui` 에서 import 한다. 새 프리미티브를 노출하려면
 * 여기에 재-export 만 추가한다.
 *
 * overlay/disclosure·form-control 프리미티브는 Radix Primitives 구현을 그대로 이식한 자체 엔진이다
 * (각 파일, `@radix-ui/*` 의존성 없음 — 공유 엔진 유틸은 `internal/`). 동작을 더 바꿀 땐
 * 개별 파일 내부만 갈아끼우면 되고, 이 배럴과 소비처는 바뀌지 않는다.
 *
 * 프리미티브는 이름 충돌(Root/Trigger/Content …)을 피해 **네임스페이스**로 내보낸다.
 *   import { Dialog } from "@comwit-ui"  →  <Dialog.Root> …
 */

// ── Primitives (namespace exports) ─────────────────────────────────
export * as Accordion from './accordion'
export * as Avatar from './avatar'
export * as Collapsible from './collapsible'
export * as Dialog from './dialog'
// bottom-sheet: Dialog 엔진 + 끌어내려 닫기(드래그 거리·속도 판정 · 안쪽 스크롤 양보). BottomSheet.Root/Trigger/Portal/Overlay/Content/Handle/Title/Description/Close
export * as BottomSheet from './bottom-sheet'
export * as DropdownMenu from './dropdown-menu'
export * as Popover from './popover'
export * as Select from './select'
export * as Tabs from './tabs'
// form-control 자체 엔진(Radix Primitives 이식). Checkbox.Root/.Indicator · RadioGroup.Root/.Item · Switch.Root/.Thumb
export * as Checkbox from './checkbox'
export * as RadioGroup from './radio-group'
export * as Switch from './switch'

// Slot 은 단일 컴포넌트라 평면 export
export * from './slot'
// 오버레이 파트의 열림·닫힘 — 스프링 설정과 모습(style(t))만 받는다. 적분·재생(Web Animations API)은 내부다
export * from './presence-animation'

// 자체 헤드리스 컴포넌트 프리미티브(radix 에 없어 직접 구현) — 단일 컴포넌트라 평면 export
export * from './input' // Input (bare, IME-safe · InputBase 대응)
export * from './textarea' // Textarea (IME-safe)
export * from './button' // Button (press/ripple/asChild)

// text-field: 라딕스식 compound(MUI TextField). a11y=React Aria + IME/focus(data-*).
//   TextField.Root/Label/Control/Description/Error + NotchedOutline(outlined 진짜 노치: fieldset+legend)
export * as TextField from './text-field'
// autocomplete(combobox): 라딕스식 compound(내부 엔진 React Aria useComboBox — a11y·필터·키보드·팝오버 소유).
//   Autocomplete.Root(collection)/Label/Control/Input/Trigger/Content + 컬렉션 마커 Item/Section
export * as Autocomplete from './autocomplete'

// ── 앱 셸·제스처·대화 (자체 헤드리스 — 동작은 여기, 시각은 templates) ────────────────
//   AppBar.Root(behavior → data-state) · BottomNav.Root/Item(선택·compact·펼치기)
//   DragScroller.Root/Track(드래그·관성·휠·키보드 가로 스크롤) · PullToRefresh.Root/Scroller/Indicator(당김 제스처)
//   Chat.Root/Title/Description/List/ScrollToBottom/Message/MessageContent/Bubble/Composer/… (가상화 목록·스크롤 규칙·컴포저)
export * as AppBar from './app-bar'
export * as BottomNav from './bottom-nav'
export * as DragScroller from './drag-scroller'
export * as PullToRefresh from './pull-to-refresh'
export * as Chat from './chat'
// 훅은 flat: 앱바·바텀내비가 공유하는 스크롤 의도, 모바일 감지, 유리 렌즈 엔진
export * from './scroll-chrome'
export * from './use-mobile'
export * from './glass-lens'

// ── Utils (라이브러리 내부 유틸: ripple — 위치/타이밍만, 시각은 소비 레이어가 className 으로 입힌다) ──────────
export * from './utils/ripple'

// ── datetime engines (헤드리스: 달력/월/시간 그리드 로직 — 시각은 templates 소유) ──
// UX-JS 만: 입력 파싱·그리드 빌드·선택/비활성 판정·뷰 상태·onChange 출력값 포매팅.
// calendar: useCalendarPanel/parseYMD/formatYMD · month: useMonthPanel/parseYM/formatYM
// · time: useTimePanel. (parseYMD≠parseYM, formatYMD≠formatYM — 이름 충돌 없음)
export * from './internal/calendar-engine'
export * from './internal/month-engine'
export * from './internal/time-engine'

// ── rich-text(tiptap) 엔진 ── useEditor 구성 소유(useRichTextEditor + TiptapEditor 타입)
export * from './rich-text'
