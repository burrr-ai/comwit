/**
 * Default component text for screens and screen readers, plus the date/time display locale.
 * Set the app's language in this file; installed source belongs to your app, so edit the strings directly.
 * Individual component props (labels, placeholder, title, emptyMessage, etc.) override these defaults.
 *
 * This Korean version is installed by comwit-ui init --locale ko (or "locale": "ko" in comwit.json).
 */
export const uiText = {
  /**
   * Intl locale for date, month, and time picker display.
   */
  locale: 'ko-KR',
  close: '닫기',
  back: '뒤로가기',
  bottomNav: '주요 메뉴',
  autocomplete: { empty: '결과가 없어요' },
  chat: {
    placeholder: '메시지',
    send: '보내기',
    stop: '멈추기',
    scrollToBottom: '최신 메시지로',
    typing: '입력 중',
    newMessages: (n: number) => `새 메시지 ${n}개`,
  },
  chip: { remove: '삭제' },
  dataTable: {
    empty: '아직 표시할 항목이 없어요.',
    refreshing: '업데이트 중',
    previous: '이전 페이지',
    next: '다음 페이지',
    range: (start: number, end: number, all: number) =>
      all > 0 ? `${all.toLocaleString()}개 중 ${start}–${end}` : '0개',
  },
  datePicker: {
    placeholder: '날짜 선택',
    title: '날짜 선택',
    clear: '지우기',
    today: '오늘',
    previousMonth: '이전 달',
    nextMonth: '다음 달',
  },
  monthPicker: {
    placeholder: '월 선택',
    title: '월 선택',
    clear: '지우기',
    thisMonth: '이번 달',
    previousYear: '이전 해',
    nextYear: '다음 해',
  },
  timePicker: { placeholder: '시간 선택', title: '시간 선택' },
  editor: { linkUrl: '링크 주소', imageUrl: '이미지 주소' },
  pagination: { nav: '페이지 이동', previous: '이전', next: '다음', more: '페이지 더 보기' },
  pager: {
    nav: '페이지 이동',
    previous: '이전 페이지',
    next: '다음 페이지',
    page: (p: number) => `${p}페이지`,
  },
  pullToRefresh: { refreshing: '새로고침 중' },
  toast: { close: '알림 닫기' },
  popup: {
    confirmTitle: '계속할까요?',
    confirm: '확인',
    cancel: '취소',
    alertTitle: '알림',
    ok: '확인',
  },
}
