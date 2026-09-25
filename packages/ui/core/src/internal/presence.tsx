import * as React from 'react'
import { useLayoutEffect } from './use-layout-effect'
import { useStateMachine } from './use-state-machine'

interface PresenceProps {
  children: React.ReactElement | ((props: { present: boolean }) => React.ReactElement)
  present: boolean
}

/**
 * JS 로 열림·닫힘을 그리는 자식(usePresenceAnimation)과 Presence 사이의 연결. 자식이 등록해 두면 닫힘이 요청돼도
 * CSS 애니메이션을 기다리는 대신 자식이 onExitComplete 를 부를 때까지 마운트를 유지한다. Portal 과 Content 처럼
 * Presence 가 겹쳐 있으면 등록·완료 알림이 바깥 Presence 까지 올라간다 — 어느 층도 먼저 언마운트하지 않는다.
 */
type PresenceContextValue = {
  present: boolean
  register: () => () => void
  onExitComplete: () => void
}
const PresenceContext = React.createContext<PresenceContextValue | null>(null)

const Presence: React.FC<PresenceProps> = (props) => {
  const { present, children } = props
  const parent = React.useContext(PresenceContext)
  const presence = usePresence(present)
  const { exitRegistry, exitComplete } = presence
  const parentRegister = parent?.register
  const parentExitComplete = parent?.onExitComplete

  // 등록·완료 함수는 present 와 무관하게 같은 참조로 둔다 — 열고 닫을 때마다 자식이 등록을 풀었다 걸지 않게.
  const register = React.useCallback(() => {
    exitRegistry.current += 1
    const unregisterParent = parentRegister?.()
    return () => {
      exitRegistry.current -= 1
      unregisterParent?.()
    }
  }, [exitRegistry, parentRegister])
  const onExitComplete = React.useCallback(() => {
    exitComplete()
    parentExitComplete?.()
  }, [exitComplete, parentExitComplete])
  const context = React.useMemo<PresenceContextValue>(
    () => ({ present, register, onExitComplete }),
    [present, register, onExitComplete]
  )

  const child = (
    typeof children === 'function'
      ? children({ present: presence.isPresent })
      : React.Children.only(children)
  ) as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>

  const ref = useStableComposedRefs(presence.ref, getElementRef(child))
  const forceMount = typeof children === 'function'
  return forceMount || presence.isPresent ? (
    <PresenceContext.Provider value={context}>
      {React.cloneElement(child, { ref })}
    </PresenceContext.Provider>
  ) : null
}

Presence.displayName = 'Presence'

/* -------------------------------------------------------------------------------------------------
 * usePresenceExit — JS 닫힘 애니메이션을 기다리게 하는 내부 훅
 * -----------------------------------------------------------------------------------------------*/

const NOOP = () => {}

/**
 * 오버레이 파트(Dialog · Popover · DropdownMenu · Select 의 Content/Overlay) 안에서 열림·닫힘을 JS 로 그릴 때
 * 쓴다(usePresenceAnimation 의 바탕 — 공개하지 않는다). 이 훅을 부른 컴포넌트가 마운트되어 있는 동안에는
 * 닫힘이 요청돼도 파트가 바로 사라지지 않고, `onExitComplete()` 가 불릴 때까지 남는다.
 *
 * `present` 는 요청된 상태다 — 닫힘이 요청되면 아직 마운트되어 있어도 false. 닫히는 도중 다시 열리면 true 로
 * 돌아오고 파트는 그대로 남는다. Presence 밖에서 부르면 늘 `present: true` 다.
 */
function usePresenceExit(): { present: boolean; onExitComplete: () => void } {
  const context = React.useContext(PresenceContext)
  const register = context?.register
  // 레이아웃 단계에서 등록한다 — Presence 가 닫힘 요청을 판단하는 것도 레이아웃 단계다.
  useLayoutEffect(() => register?.(), [register])
  return {
    present: context?.present ?? true,
    onExitComplete: context?.onExitComplete ?? NOOP,
  }
}

/* -------------------------------------------------------------------------------------------------
 * usePresence
 * -----------------------------------------------------------------------------------------------*/

function usePresence(present: boolean) {
  const [node, setNode] = React.useState<HTMLElement>()
  const stylesRef = React.useRef<CSSStyleDeclaration | null>(null)
  const prevPresentRef = React.useRef(present)
  const prevAnimationNameRef = React.useRef<string>('none')
  const mountAnimationNameRef = React.useRef<string | undefined>(undefined)
  /** usePresenceExit 로 등록한 자식 수. 0 보다 크면 닫힘을 JS 가 그린다. */
  const exitRegistry = React.useRef(0)
  const initialState = present ? 'mounted' : 'unmounted'
  const [state, send] = useStateMachine(initialState, {
    mounted: {
      UNMOUNT: 'unmounted',
      ANIMATION_OUT: 'unmountSuspended',
    },
    unmountSuspended: {
      MOUNT: 'mounted',
      ANIMATION_END: 'unmounted',
    },
    unmounted: {
      MOUNT: 'mounted',
    },
  })

  React.useEffect(() => {
    if (state === 'mounted') {
      // Use the animation name captured during the layout phase (or the ref
      // callback on first mount). By the time this passive effect runs,
      // sibling effects like react-remove-scroll and DismissableLayer may have
      // dirtied body styles, so re-reading from the live CSSStyleDeclaration
      // here would force an expensive synchronous style recalculation.
      // See: https://github.com/radix-ui/primitives/issues/1634
      prevAnimationNameRef.current =
        mountAnimationNameRef.current ?? getAnimationName(stylesRef.current)
      mountAnimationNameRef.current = undefined
    } else {
      prevAnimationNameRef.current = 'none'
    }
  }, [state])

  useLayoutEffect(() => {
    const styles = stylesRef.current
    const wasPresent = prevPresentRef.current
    const hasPresentChanged = wasPresent !== present

    if (hasPresentChanged) {
      const prevAnimationName = prevAnimationNameRef.current
      const currentAnimationName = getAnimationName(styles)

      if (present) {
        // Capture the animation name now, while styles are still "clean"
        // (before sibling passive effects dirty the body). The later passive
        // effect will read from this ref instead of the live
        // CSSStyleDeclaration, avoiding a forced style recalculation.
        mountAnimationNameRef.current = currentAnimationName
        send('MOUNT')
      } else if (exitRegistry.current > 0 && wasPresent) {
        // JS 애니메이션이 닫힘을 그린다 — 등록한 자식이 onExitComplete 를 부를 때까지 남는다.
        send('ANIMATION_OUT')
      } else if (currentAnimationName === 'none' || styles?.display === 'none') {
        // If there is no exit animation or the element is hidden, animations won't run
        // so we unmount instantly
        send('UNMOUNT')
      } else {
        /**
         * When `present` changes to `false`, we check changes to animation-name to
         * determine whether an animation has started. We chose this approach (reading
         * computed styles) because there is no `animationrun` event and `animationstart`
         * fires after `animation-delay` has expired which would be too late.
         */
        const isAnimating = prevAnimationName !== currentAnimationName

        if (wasPresent && isAnimating) {
          send('ANIMATION_OUT')
        } else {
          send('UNMOUNT')
        }
      }

      prevPresentRef.current = present
    }
  }, [present, send])

  useLayoutEffect(() => {
    if (node) {
      let timeoutId: number
      const ownerWindow = node.ownerDocument.defaultView ?? window
      /**
       * Triggering an ANIMATION_OUT during an ANIMATION_IN will fire an `animationcancel`
       * event for ANIMATION_IN after we have entered `unmountSuspended` state. So, we
       * make sure we only trigger ANIMATION_END for the currently active animation.
       */
      const handleAnimationEnd = (event: AnimationEvent) => {
        const currentAnimationName = getAnimationName(stylesRef.current)
        // The event.animationName is unescaped for CSS syntax,
        // so we need to escape it to compare with the animationName computed from the style.
        const isCurrentAnimation = currentAnimationName.includes(CSS.escape(event.animationName))
        if (event.target === node && isCurrentAnimation) {
          // With React 18 concurrency this update is applied a frame after the
          // animation ends, creating a flash of visible content. By setting the
          // animation fill mode to "forwards", we force the node to keep the
          // styles of the last keyframe, removing the flash.
          //
          // Previously we flushed the update via ReactDom.flushSync, but with
          // exit animations this resulted in the node being removed from the
          // DOM before the synthetic animationEnd event was dispatched, meaning
          // user-provided event handlers would not be called.
          // https://github.com/radix-ui/primitives/pull/1849
          send('ANIMATION_END')
          if (!prevPresentRef.current) {
            const currentFillMode = node.style.animationFillMode
            node.style.animationFillMode = 'forwards'
            // Reset the style after the node had time to unmount (for cases
            // where the component chooses not to unmount). Doing this any
            // sooner than `setTimeout` (e.g. with `requestAnimationFrame`)
            // still causes a flash.
            timeoutId = ownerWindow.setTimeout(() => {
              if (node.style.animationFillMode === 'forwards') {
                node.style.animationFillMode = currentFillMode
              }
            })
          }
        }
      }
      const handleAnimationStart = (event: AnimationEvent) => {
        if (event.target === node) {
          // if animation occurred, store its name as the previous animation.
          prevAnimationNameRef.current = getAnimationName(stylesRef.current)
        }
      }
      node.addEventListener('animationstart', handleAnimationStart)
      node.addEventListener('animationcancel', handleAnimationEnd)
      node.addEventListener('animationend', handleAnimationEnd)
      return () => {
        ownerWindow.clearTimeout(timeoutId)
        node.removeEventListener('animationstart', handleAnimationStart)
        node.removeEventListener('animationcancel', handleAnimationEnd)
        node.removeEventListener('animationend', handleAnimationEnd)
      }
    } else {
      // Transition to the unmounted state if the node is removed prematurely.
      // We avoid doing so during cleanup as the node may change but still exist.
      send('ANIMATION_END')
    }
  }, [node, send])

  return {
    isPresent: ['mounted', 'unmountSuspended'].includes(state),
    exitRegistry,
    exitComplete: React.useCallback(() => send('ANIMATION_END'), [send]),
    ref: React.useCallback((node: HTMLElement) => {
      if (node) {
        const styles = getComputedStyle(node)
        stylesRef.current = styles
        // Eagerly read the animation name while styles are clean. Ref
        // callbacks fire during the commit phase, before any passive effects
        // can dirty body styles. This cached value is consumed by the passive
        // effect that records prevAnimationNameRef, letting it skip a
        // redundant (and expensive) live-style read.
        mountAnimationNameRef.current = getAnimationName(styles)
      } else {
        stylesRef.current = null
      }
      setNode(node)
    }, []),
  }
}

/* -----------------------------------------------------------------------------------------------*/

type PossibleRef<T> = React.Ref<T> | undefined

function setRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    return ref(value)
  } else if (ref !== null && ref !== undefined) {
    ref.current = value
  }
}

/**
 * Unlike `useComposedRefs`, the returned callback never changes identity, even
 * when the composed refs do. This matters in React 19: when a callback ref's
 * identity changes between renders, React detaches the previous ref (calls it
 * with `null`) and attaches the new one on every commit. Because `Presence`
 * calls `setNode` from its own ref, an unstable consumer ref would otherwise
 * cause React to re-run that update on every commit, resulting in a "Maximum
 * update depth exceeded" loop.
 *
 * The latest refs are always read at attach/detach time, so the most recent
 * consumer ref still receives the node when it mounts or unmounts.
 *
 * @see https://github.com/radix-ui/primitives/issues/3664
 */
function useStableComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  // Keep the latest refs without changing the callback identity. Assigning during render is
  // safe here because we only ever read `.current` later (at commit time, in the ref callback).
  const refsRef = React.useRef(refs)
  refsRef.current = refs

  return React.useCallback((node: T | null) => {
    const currentRefs = refsRef.current
    let hasCleanup = false
    const cleanups = currentRefs.map((ref) => {
      const cleanup = setRef(ref, node)
      if (!hasCleanup && typeof cleanup === 'function') {
        hasCleanup = true
      }
      return cleanup
    })

    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i]
          if (typeof cleanup === 'function') {
            cleanup()
          } else {
            setRef(currentRefs[i], null)
          }
        }
      }
    }
  }, [])
}

function getAnimationName(styles: CSSStyleDeclaration | null) {
  return styles?.animationName || 'none'
}

// Before React 19 accessing `element.props.ref` will throw a warning and suggest using `element.ref`
// After React 19 accessing `element.ref` does the opposite.
// https://github.com/facebook/react/pull/28348
//
// Access the ref using the method that doesn't yield a warning.
function getElementRef(element: React.ReactElement<{ ref?: React.Ref<unknown> }>) {
  // React <=18 in DEV
  let getter = Object.getOwnPropertyDescriptor(element.props, 'ref')?.get
  let mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning
  if (mayWarn) {
    return (element as any).ref
  }

  // React 19 in DEV
  getter = Object.getOwnPropertyDescriptor(element, 'ref')?.get
  mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning
  if (mayWarn) {
    return element.props.ref
  }

  // Not DEV
  return element.props.ref || (element as any).ref
}

const Root = Presence

export {
  Presence,
  usePresenceExit,
  //
  Root,
}
export type { PresenceProps }
