/**
 * comwit-ui — Comwit's headless UI primitives (Radix-style, intended as an independent library).
 *
 * This barrel is the only public entry point. Consumers (lib/components/ui, admin/ui, etc.) import primitives
 * from @comwit-ui. Expose a new primitive by adding its re-export here.
 *
 * Overlay/disclosure and form-control primitives are in-house ports of Radix Primitives. They have no @radix-ui/*
 * dependencies; shared engine utilities live in internal/. Behavior changes stay within each primitive file,
 * leaving this barrel and consumers unchanged.
 *
 * Primitives use namespace exports to avoid Root/Trigger/Content name collisions.
 *   import { Dialog } from "@comwit-ui"  →  <Dialog.Root> …
 */

// ── Primitives (namespace exports) ─────────────────────────────────
export * as Accordion from './accordion'
export * as Avatar from './avatar'
export * as Collapsible from './collapsible'
export * as Dialog from './dialog'
// bottom-sheet: Dialog engine plus drag-to-dismiss (distance/velocity thresholds and nested-scroll handoff). BottomSheet.Root/Trigger/Portal/Overlay/Content/Handle/Title/Description/Close
export * as BottomSheet from './bottom-sheet'
export * as DropdownMenu from './dropdown-menu'
export * as Popover from './popover'
export * as Select from './select'
export * as Tabs from './tabs'
// In-house form-control engines (Radix Primitives ports). Checkbox.Root/.Indicator · RadioGroup.Root/.Item · Switch.Root/.Thumb
export * as Checkbox from './checkbox'
export * as RadioGroup from './radio-group'
export * as Switch from './switch'

// Slot is a single component, so export it directly.
export * from './slot'
// Overlay enter/exit animation takes only spring settings and style(t); integration and Web Animations API playback are internal.
export * from './presence-animation'

// Custom headless component primitives (not provided by Radix); single components are exported directly.
export * from './input' // Input (bare, IME-safe; equivalent to InputBase).
export * from './textarea' // Textarea (IME-safe)
export * from './button' // Button (press/ripple/asChild)

// text-field: Radix-style compound component (MUI TextField equivalent). Accessibility uses React Aria plus IME/focus data-* state.
//   TextField.Root/Label/Control/Description/Error + NotchedOutline (a true outlined notch using fieldset + legend).
export * as TextField from './text-field'
// autocomplete (combobox): Radix-style compound component using React Aria useComboBox for accessibility, filtering, keyboard, and popover behavior.
//   Autocomplete.Root(collection)/Label/Control/Input/Trigger/Content + Item/Section collection markers.
export * as Autocomplete from './autocomplete'

// ── App shell, gestures, and chat (custom headless behavior here; visuals in templates) ──
//   AppBar.Root(behavior → data-state) · BottomNav.Root/Item(selection, compact mode, expansion).
//   DragScroller.Root/Track(drag, inertia, wheel, and keyboard horizontal scrolling) · PullToRefresh.Root/Scroller/Indicator(pull gesture).
//   Chat.Root/Title/Description/List/ScrollToBottom/Message/MessageContent/Bubble/Composer/… (virtualized list, scroll rules, and composer).
//   AppShell.Root/Scroller/Indicator (one main scroller, scroll intent, and pull-to-refresh together).
export * as AppShell from './app-shell'
export * as AppBar from './app-bar'
export * as BottomNav from './bottom-nav'
export * as DragScroller from './drag-scroller'
export * as PullToRefresh from './pull-to-refresh'
export * as Chat from './chat'
// Hooks have direct exports: shared app-bar/bottom-nav scroll intent, mobile detection, and glass lens engine.
export * from './scroll-chrome'
// Back-navigation depth: go back when app history exists; otherwise replace with the parent route. Consumers supply the router adapter.
export * from './nav-depth'
export * from './use-mobile'
export * from './glass-lens'

// ── Utilities (internal ripple positioning/timing; consumers apply visuals through className) ──
export * from './utils/ripple'

// ── Datetime engines (headless calendar/month/time grid logic; templates own visuals) ──
// UX logic only: parse input, build grids, determine selection/disabled state, track the view, and format onChange values.
// calendar: useCalendarPanel/parseYMD/formatYMD · month: useMonthPanel/parseYM/formatYM
// · time: useTimePanel. (parseYMD ≠ parseYM and formatYMD ≠ formatYM, so names do not collide.)
export * from './internal/calendar-engine'
export * from './internal/month-engine'
export * from './internal/time-engine'

// ── rich-text (tiptap) engine: owns useEditor configuration (useRichTextEditor + TiptapEditor type).
export * from './rich-text'
