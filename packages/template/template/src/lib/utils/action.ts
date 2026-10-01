/**
 * API action 구현을 선언하는 identity 함수다.
 * build loader는 이 호출을 식별해 client/server index 산출물을 만들고, 런타임에는 원본
 * async handler를 그대로 반환한다.
 */
export function createAction<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  return fn
}

// oxlint-disable-next-line typescript/no-explicit-any
type ActionFn = (...args: any[]) => Promise<unknown>

/**
 * API index의 공개 객체를 표시하는 identity 함수다. Next build에서는 index loader가 이
 * 호출과 action import 전체를 환경별 id facade로 교체한다.
 */
export function resolveActions<T extends Record<string, ActionFn>>(
  actions: T,
): T {
  return actions
}
