/**
 * Default component text for screens and screen readers, plus the date/time display locale.
 * Set the app's language in this file; installed source belongs to your app, so edit the strings directly.
 * Individual component props (labels, placeholder, title, emptyMessage, etc.) override these defaults.
 *
 * comwit-ui init --locale ko (or "locale": "ko" in comwit.json) installs the Korean version.
 */
export const uiText = {
  /** Intl locale for date, month, and time picker display. */
  locale: 'en-US',
  close: 'Close',
  back: 'Back',
  bottomNav: 'Main',
  autocomplete: { empty: 'No results' },
  chat: {
    placeholder: 'Message',
    send: 'Send',
    stop: 'Stop',
    scrollToBottom: 'Jump to latest',
    typing: 'Typing',
    newMessages: (n: number) => (n === 1 ? '1 new message' : `${n} new messages`),
  },
  chip: { remove: 'Remove' },
  dataTable: {
    empty: 'Nothing to show yet.',
    refreshing: 'Updating',
    previous: 'Previous page',
    next: 'Next page',
    range: (start: number, end: number, all: number) =>
      all > 0 ? `${start}–${end} of ${all.toLocaleString()}` : '0 items',
  },
  datePicker: {
    placeholder: 'Select date',
    title: 'Select date',
    clear: 'Clear',
    today: 'Today',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
  },
  monthPicker: {
    placeholder: 'Select month',
    title: 'Select month',
    clear: 'Clear',
    thisMonth: 'This month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
  },
  timePicker: { placeholder: 'Select time', title: 'Select time' },
  editor: { linkUrl: 'Link URL', imageUrl: 'Image URL' },
  pagination: { nav: 'Pagination', previous: 'Previous', next: 'Next', more: 'More pages' },
  pager: {
    nav: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    page: (p: number) => `Page ${p}`,
  },
  pullToRefresh: { refreshing: 'Refreshing' },
  toast: { close: 'Close notification' },
  popup: {
    confirmTitle: 'Are you sure?',
    confirm: 'Confirm',
    cancel: 'Cancel',
    alertTitle: 'Notice',
    ok: 'OK',
  },
}
