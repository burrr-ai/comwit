// comwit-ui — event-handler composition utility. An in-house port of Radix Primitives with no external Radix package dependency.

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
