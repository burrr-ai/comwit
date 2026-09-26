/**
 * 컴포넌트가 화면과 스크린리더에 쓰는 기본 문구, 그리고 날짜·시간 표시 로케일.
 * 앱의 언어는 이 파일 하나로 정한다 — 설치된 파일은 내 코드이니 문구를 그대로 고친다.
 * 각 컴포넌트의 prop(labels · placeholder · title · emptyMessage …)이 한 번 더 덮는다.
 *
 * `comwit-ui init --locale ko`(또는 comwit.json 의 "locale": "ko")면 한국어판이 설치된다.
 */
export const uiText = {
  /** Intl 로케일 — 피커의 날짜·월·시간 표시. */
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
