// comwit-ui — 이벤트 핸들러 합성 유틸. Radix Primitives 구현을 그대로 이식한 자체 엔진 (외부 Radix 패키지 의존성 없음).

export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  originalEventHandler?: (event: E) => void,
  ourEventHandler?: (event: E) => void,
  { checkForDefaultPrevented = true } = {}
) {
  return function handleEvent(event: E) {
    originalEventHandler?.(event)

    if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) {
      return ourEventHandler?.(event)
    }
  }
}
