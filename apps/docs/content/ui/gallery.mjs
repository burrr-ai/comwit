// Gallery layout for /ui/components — the order people browse in.
// Distinctive UX first; plain building blocks last as a quick specimen sheet.
// Every template component must appear exactly once (scripts/gen-ui.mjs checks this).
//
// Every item gets its own row (name column + stage), so the sidebar can bring any of them to the top.
// exhibit: 'phone' renders inside a device frame, 'wide' fills the stage, default is a card (≤576px).

// Comwit UI curates libraries rather than reinventing them. When a component's npm dependencies
// include one of these, the gallery links to it ("Built on …"). Keyed by package name.
export const credits = {
  '@ssgoi/react': { label: 'SSGOI', href: 'https://ssgoi.dev' },
  sonner: { label: 'Sonner', href: 'https://sonner.emilkowal.ski' },
  'overlay-kit': { label: 'overlay-kit', href: 'https://overlay-kit.slash.page' },
  motion: { label: 'Motion', href: 'https://motion.dev' },
  '@tiptap/react': { label: 'Tiptap', href: 'https://tiptap.dev' },
  '@tanstack/react-table': { label: 'TanStack Table', href: 'https://tanstack.com/table' },
  'react-day-picker': { label: 'React DayPicker', href: 'https://daypicker.dev' },
  'react-hook-form': { label: 'React Hook Form', href: 'https://react-hook-form.com' },
  'react-virtuoso': { label: 'React Virtuoso', href: 'https://virtuoso.dev' },
}

// Libraries the headless engine (@comwit/ui) wraps on a component's behalf. The template itself only
// depends on @comwit/ui, so these are credited by component name instead of by npm dependency.
export const engineCredits = {
  chat: ['react-virtuoso'],
}

export const groups = [
  {
    id: 'mobile',
    title: 'Mobile app',
    blurb: 'Chrome that behaves like a native app and gets out of the way while you read.',
    items: [
      {
        name: 'app-bar',
        title: 'App bar',
        exhibit: 'phone',
        summary: 'Glass top bar. Hides while you scroll down, returns the moment you scroll up.',
      },
      {
        name: 'bottom-nav',
        title: 'Bottom nav',
        exhibit: 'phone',
        summary:
          'Floating tab capsule. The indicator springs between tabs; the bar shrinks as you scroll.',
      },
      {
        name: 'page-transition',
        title: 'Page transition',
        exhibit: 'phone',
        summary:
          'Hero, zoom, drill or fade from the photo grid into the photo. One keyed boundary marks the page; your router or plain state drives it.',
      },
      {
        name: 'bottom-sheet',
        title: 'Bottom sheet',
        exhibit: 'phone',
        summary:
          'Rises from the bottom. Drag the handle down to dismiss; the scrim fades as you pull.',
      },
      {
        name: 'pull-to-refresh',
        title: 'Pull to refresh',
        exhibit: 'phone',
        summary: 'Pull down at the top to reload. Only the dial moves, so sticky bars stay put.',
      },
      {
        name: 'drag-scroller',
        title: 'Drag scroller',
        exhibit: 'wide',
        summary:
          'Horizontal rail with drag, flick momentum, wheel and arrow keys. Taps still click.',
      },
    ],
  },
  {
    id: 'messaging',
    title: 'Chat',
    blurb:
      'Header, messages and composer that fill their parent. The list is virtualized and scrolls the way each kind of conversation expects.',
    items: [
      {
        name: 'chat',
        title: 'Chat',
        exhibit: 'phone',
        summary:
          'Messenger mode keeps you at the bottom; assistant mode lifts your message to the top and streams the answer under it.',
      },
    ],
  },
  {
    id: 'surfaces',
    title: 'Glass',
    blurb: 'A refracting surface for everything that floats above content.',
    items: [
      {
        name: 'glass',
        title: 'Glass',
        exhibit: 'wide',
        summary:
          'Four materials: morphing lens, blur, frosted and fade. Put it under any container.',
      },
      {
        name: 'dropdown-menu',
        title: 'Dropdown menu',
        summary: 'Menus on morphing glass. Hover tints the text instead of filling the row.',
      },
      {
        name: 'popover',
        title: 'Popover',
        summary: 'Anchored glass panel for small tasks next to their trigger.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    blurb: 'Tell people what happened and what to do next.',
    items: [
      {
        name: 'toast',
        title: 'Toast',
        summary: 'Glass toasts. Top of the screen on phones, bottom right on desktop.',
      },
      {
        name: 'popup',
        title: 'Popup',
        summary:
          'await popup.confirm(), popup.alert() and popup.sheet() from anywhere, no state needed.',
      },
      {
        name: 'alert',
        title: 'Alert',
        summary: 'Inline callout in five tones.',
      },
      {
        name: 'empty-state',
        title: 'Empty state',
        summary: 'When a list is empty, offer the one thing to do next.',
      },
    ],
  },
  {
    id: 'pickers',
    title: 'Pickers',
    blurb: 'A popover on desktop, a bottom sheet on phones. Same panel, same value.',
    items: [
      {
        name: 'date-picker',
        title: 'Date picker',
        summary: 'YYYY-MM-DD in, YYYY-MM-DD out. Min, max and any locale.',
      },
      {
        name: 'time-picker',
        title: 'Time picker',
        summary: 'Slot list that scrolls to the selected time.',
      },
      {
        name: 'month-picker',
        title: 'Month picker',
        summary: 'Year pages of twelve months for billing periods and reports.',
      },
      {
        name: 'calendar',
        title: 'Calendar',
        summary: 'Inline calendar for single dates and ranges.',
      },
    ],
  },
  {
    id: 'selection',
    title: 'Selection',
    blurb: 'Small controls with a physical response: ripples, springs and a drawn check.',
    items: [
      {
        name: 'segmented-control',
        title: 'Segmented control',
        summary: 'A white pill on a sunken track for switching views and filters.',
      },
      {
        name: 'chip',
        title: 'Chip',
        summary: 'Filters and tags with a ripple, a selected state and an optional remove button.',
      },
      {
        name: 'checkbox',
        title: 'Checkbox',
        summary: 'The check draws itself in. A soft halo follows hover and press.',
      },
      {
        name: 'radio-group',
        title: 'Radio group',
        summary: 'The dot pops in on a spring, with arrow-key navigation.',
      },
      {
        name: 'pager',
        title: 'Pager',
        summary: 'Numbered pages from just page and totalPages.',
      },
    ],
  },
  {
    id: 'forms',
    title: 'Forms and data',
    blurb: 'Inputs that handle Korean and Japanese IME composition, plus tables that never jump.',
    items: [
      {
        name: 'text-field',
        title: 'Text field',
        summary: 'Label, helper text and error wired to the control for screen readers.',
      },
      {
        name: 'autocomplete',
        title: 'Autocomplete',
        summary: 'Type to filter, arrow keys to choose.',
      },
      {
        name: 'select',
        title: 'Select',
        summary: 'Pick one option from a list, with type-ahead and a brand check mark.',
      },
      {
        name: 'form',
        title: 'Form',
        summary: 'react-hook-form fields with accessible messages.',
      },
      {
        name: 'data-table',
        title: 'Data table',
        exhibit: 'wide',
        summary:
          'Server pagination with skeleton rows and a quiet refetch badge. The height never jumps.',
      },
      {
        name: 'editor',
        title: 'Editor',
        exhibit: 'wide',
        summary: 'Rich text on tiptap with a compact toolbar.',
      },
    ],
  },
  {
    id: 'basics',
    title: 'Basics',
    blurb: 'The everyday parts, styled with the same tokens.',
    specimen: true,
    items: [
      { name: 'button', title: 'Button', summary: 'Pill buttons that press in.' },
      { name: 'badge', title: 'Badge', summary: 'Status labels.' },
      { name: 'input', title: 'Input', summary: 'Single-line text.' },
      { name: 'input-group', title: 'Input group', summary: 'Input with icons or units.' },
      { name: 'textarea', title: 'Textarea', summary: 'Grows with its content.' },
      { name: 'label', title: 'Label', summary: 'Names a control.' },
      { name: 'switch', title: 'Switch', summary: 'On or off, right away.' },
      { name: 'tabs', title: 'Tabs', summary: 'Segmented tabs.' },
      { name: 'accordion', title: 'Accordion', summary: 'Stacked sections that expand.' },
      { name: 'collapsible', title: 'Collapsible', summary: 'Show or hide one region.' },
      { name: 'dialog', title: 'Dialog', summary: 'Modal window.' },
      { name: 'sheet', title: 'Sheet', summary: 'Panel from any edge.' },
      { name: 'card', title: 'Card', summary: 'Content container.' },
      { name: 'table', title: 'Table', summary: 'Plain table parts.' },
      { name: 'avatar', title: 'Avatar', summary: 'Image with a fallback.' },
      { name: 'separator', title: 'Separator', summary: 'Hairline divider.' },
      { name: 'skeleton', title: 'Skeleton', summary: 'Loading placeholder.' },
      { name: 'pagination', title: 'Pagination', summary: 'Composable page links.' },
    ],
  },
]
