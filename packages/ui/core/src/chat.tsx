'use client'

/**
 * Headless chat owns behavior while templates style className/data attributes. List uses react-virtuoso with unread counts and initial scrolling to the latest message. Messenger mode follows own messages and follows incoming messages only while at the bottom; assistant mode pins the user's message at the top with --chat-tail-space below it. ScrollToBottom appears away from the bottom and exposes data-unread. Message/MessageContent/Bubble expose alignment and tone (end: primary, start: muted, assistant: plain). Composer supports controlled/uncontrolled input, send, Enter/Shift+Enter, IME guards, auto-height, and pending/Stop behavior. Compose Root, Title, List with a message renderer, ScrollToBottom, and Composer with Input/Stop/Submit. Root exposes data-mode; scroll controls expose unread/state; messages expose align/tone; Composer exposes pending/disabled and Submit exposes disabled.
 */

import * as React from 'react'
import { Virtuoso, type ItemProps, type VirtuosoHandle } from 'react-virtuoso'

import { composeEventHandlers } from './internal/compose-event-handlers'
import { useComposedRefs } from './internal/compose-refs'
import { createContext } from './internal/context'
import { useId } from './internal/id'
import { Primitive } from './internal/primitive'
import { useLayoutEffect } from './internal/use-layout-effect'
import { Textarea, type TextareaProps } from './textarea'

type ChatMode = 'messenger' | 'assistant'
type ChatAlign = 'start' | 'end'
type ChatTone = 'primary' | 'muted' | 'plain'
type ScrollBehaviorOption = 'auto' | 'smooth'

const TAIL_SPACE_VAR = '--chat-tail-space'

type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>

/* -------------------------------------------------------------------------------------------------
 * Chat (Root)
 * -----------------------------------------------------------------------------------------------*/

const CHAT_NAME = 'Chat'

type ListState = { settled: boolean; atBottom: boolean; unread: number }
type ChatListHandle = { scrollToBottom: (behavior: ScrollBehaviorOption) => void }

type ChatRootContextValue = {
  mode: ChatMode
  titleId: string
  descriptionId: string
  setHasTitle: (value: boolean) => void
  setHasDescription: (value: boolean) => void
  setListState: React.Dispatch<React.SetStateAction<ListState>>
  listHandle: React.RefObject<ChatListHandle | null>
}
type ChatStateContextValue = ListState & {
  scrollToBottom: (behavior?: ScrollBehaviorOption) => void
}

// Separate contexts: List reads stable Root context and writes scroll state;
// only ScrollToBottom subscribes to bottom/unread changes, avoiding list rerenders.
const [ChatRootProvider, useChatRootContext] = createContext<ChatRootContextValue>(CHAT_NAME)
const [ChatStateProvider, useChatStateContext] = createContext<ChatStateContextValue>(CHAT_NAME)

interface ChatRootProps extends PrimitiveDivProps {
  /** Scroll rules and default bubble tone. List can override mode. */
  mode?: ChatMode
}

const ChatRoot = React.forwardRef<HTMLDivElement, ChatRootProps>((props, forwardedRef) => {
  const { mode = 'messenger', ...rootProps } = props
  const titleId = useId()
  const descriptionId = useId()
  const [hasTitle, setHasTitle] = React.useState(false)
  const [hasDescription, setHasDescription] = React.useState(false)
  const [listState, setListState] = React.useState<ListState>({
    settled: false,
    atBottom: true,
    unread: 0,
  })
  const listHandle = React.useRef<ChatListHandle | null>(null)
  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehaviorOption = 'smooth') => listHandle.current?.scrollToBottom(behavior),
    []
  )

  return (
    <ChatRootProvider
      mode={mode}
      titleId={titleId}
      descriptionId={descriptionId}
      setHasTitle={setHasTitle}
      setHasDescription={setHasDescription}
      setListState={setListState}
      listHandle={listHandle}
    >
      <ChatStateProvider
        settled={listState.settled}
        atBottom={listState.atBottom}
        unread={listState.unread}
        scrollToBottom={scrollToBottom}
      >
        <Primitive.div
          role={hasTitle ? 'region' : undefined}
          aria-labelledby={hasTitle ? titleId : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          data-mode={mode}
          {...rootProps}
          ref={forwardedRef}
        />
      </ChatStateProvider>
    </ChatRootProvider>
  )
})
ChatRoot.displayName = CHAT_NAME

/*
 * ChatTitle and ChatDescription supply Root's accessible name and description.
 */

const TITLE_NAME = 'ChatTitle'
type PrimitiveHeadingProps = React.ComponentPropsWithoutRef<typeof Primitive.h2>

const ChatTitle = React.forwardRef<HTMLHeadingElement, PrimitiveHeadingProps>(
  (props, forwardedRef) => {
    const context = useChatRootContext(TITLE_NAME)
    const { setHasTitle } = context
    useLayoutEffect(() => {
      setHasTitle(true)
      return () => setHasTitle(false)
    }, [setHasTitle])
    return <Primitive.h2 id={context.titleId} {...props} ref={forwardedRef} />
  }
)
ChatTitle.displayName = TITLE_NAME

const DESCRIPTION_NAME = 'ChatDescription'
type PrimitiveParagraphProps = React.ComponentPropsWithoutRef<typeof Primitive.p>

const ChatDescription = React.forwardRef<HTMLParagraphElement, PrimitiveParagraphProps>(
  (props, forwardedRef) => {
    const context = useChatRootContext(DESCRIPTION_NAME)
    const { setHasDescription } = context
    useLayoutEffect(() => {
      setHasDescription(true)
      return () => setHasDescription(false)
    }, [setHasDescription])
    return <Primitive.p id={context.descriptionId} {...props} ref={forwardedRef} />
  }
)
ChatDescription.displayName = DESCRIPTION_NAME

/*
 * ChatList: virtualization and scroll rules.
 */

const LIST_NAME = 'ChatList'

type Pending = { target: 'pin'; behavior: ScrollBehaviorOption } | null
type TailKey = number | 'footer'

type ListContext = {
  header: React.ReactNode
  footer: React.ReactNode
  footerRef: (element: HTMLDivElement | null) => void
  pinned: number | null
  tailRef: (key: number) => (element: HTMLDivElement | null) => void
}

interface ChatListProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  items: readonly T[]
  /** Render one message. */
  children: (item: T, index: number) => React.ReactNode
  /** List key; defaults to item.id, then index. */
  itemKey?: (item: T, index: number) => React.Key
  /** Identify own messages for scroll rules; defaults to item.role === 'user'. */
  isOwn?: (item: T) => boolean
  /** Override Root's mode. */
  mode?: ChatMode
  /** Content displayed instead of the list when there are no messages. */
  empty?: React.ReactNode
  /** Content before the first message, scrolling with the list. */
  header?: React.ReactNode
  /** Content after the last message, such as typing status; outside virtualization and always rendered. */
  footer?: React.ReactNode
  /** Gap in pixels above the pinned message in assistant mode. Default: 0. */
  pinOffset?: number
  /** Bottom-detection tolerance in pixels. Default: 24. */
  atBottomThreshold?: number
  /** Prerender distance above and below the viewport in pixels. Default: 320. */
  overscan?: number
  /** Scroller element. */
  ref?: React.Ref<HTMLDivElement>
}

function defaultIsOwn(item: unknown) {
  return typeof item === 'object' && item !== null && (item as { role?: unknown }).role === 'user'
}
function defaultKey(item: unknown, index: number): React.Key {
  if (typeof item === 'object' && item !== null && 'id' in item) {
    const id = (item as { id: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return id
  }
  return index
}

// Keep Virtuoso Header/Footer/Item component identities stable to avoid remounts; pass changing content through context.
function ListHeader({ context }: { context?: ListContext }) {
  return <>{context?.header ?? null}</>
}
function ListFooter({ context }: { context?: ListContext }) {
  return (
    <>
      <div ref={context?.footerRef}>{context?.footer}</div>
      {/* Assistant-mode space below the pinned user message. Its variable lives on the scroller. */}
      <div aria-hidden="true" style={{ height: `var(${TAIL_SPACE_VAR}, 0px)` }} />
    </>
  )
}
function ListItem({
  item: _item,
  context,
  ...props
}: ItemProps<unknown> & { context?: ListContext }) {
  const index = props['data-index']
  const ref =
    context && context.pinned !== null && index >= context.pinned
      ? context.tailRef(index)
      : undefined
  return <div {...props} ref={ref} />
}
const LIST_COMPONENTS = { Header: ListHeader, Footer: ListFooter, Item: ListItem }

function ChatList<T>({
  items,
  children,
  itemKey,
  isOwn = defaultIsOwn,
  mode: modeProp,
  empty,
  header = null,
  footer = null,
  pinOffset = 0,
  atBottomThreshold = 24,
  overscan = 320,
  ref,
  ...props
}: ChatListProps<T>) {
  const root = useChatRootContext(LIST_NAME)
  const mode = modeProp ?? root.mode
  const { setListState, listHandle } = root

  const virtuoso = React.useRef<VirtuosoHandle>(null)
  const scroller = React.useRef<HTMLElement | null>(null)
  const atBottomRef = React.useRef(true)
  const pending = React.useRef<Pending>(null)
  const itemsRef = React.useRef(items)
  itemsRef.current = items
  const isOwnRef = React.useRef(isOwn)
  isOwnRef.current = isOwn
  const pinOffsetRef = React.useRef(pinOffset)
  pinOffsetRef.current = pinOffset
  const modeRef = React.useRef(mode)
  modeRef.current = mode

  // Scroll to the actual DOM scrollHeight after layout settles.
  // Virtuoso's total height can lag when a footer disappears and an item is appended in the same commit.
  // Use the scroller's real height instead of index calculations, then adjust after two equal-height frames.
  // Scroll immediately after commit so throttled background-tab rAF does not delay bottom alignment;
  // adjust again after two stable-height frames, including image loads. Do not count messages received while following as unread.
  const scrollFrame = React.useRef(0)
  const following = React.useRef(false)
  const followingTimer = React.useRef(0)
  // True while assistant mode smoothly moves the user's message to the top. Height changes during this movement
  // must not force immediate bottom alignment, which would cancel the animation to the same destination.
  const pinning = React.useRef(false)
  const pinningTimer = React.useRef(0)
  const scrollToEnd = React.useCallback((behavior: ScrollBehaviorOption) => {
    cancelAnimationFrame(scrollFrame.current)
    const scroll = () => {
      const element = scroller.current
      if (!element) return
      const top = element.scrollHeight - element.clientHeight
      if (virtuoso.current) virtuoso.current.scrollTo({ top, behavior })
      else element.scrollTo({ top, behavior })
    }
    following.current = true
    window.clearTimeout(followingTimer.current)
    followingTimer.current = window.setTimeout(() => {
      following.current = false
    }, 1500)
    scroll()
    let seen = scroller.current?.scrollHeight ?? -1
    let frames = 0
    const settle = () => {
      const element = scroller.current
      if (!element) return
      const height = element.scrollHeight
      frames += 1
      if (height !== seen && frames < 12) {
        seen = height
        scrollFrame.current = requestAnimationFrame(settle)
        return
      }
      scroll()
    }
    scrollFrame.current = requestAnimationFrame(settle)
  }, [])
  React.useEffect(
    () => () => {
      cancelAnimationFrame(scrollFrame.current)
      window.clearTimeout(followingTimer.current)
      window.clearTimeout(pinningTimer.current)
    },
    []
  )

  // Assistant mode: fill the space below the pinned user message.
  // Measure from the pinned index through the footer and fill unused viewport height with --chat-tail-space.
  // As the answer grows, reduce tail space to keep total height and scroll stable. Update CSS without rerendering.
  const [pinned, setPinned] = React.useState<number | null>(null)
  const pinnedRef = React.useRef<number | null>(null)
  pinnedRef.current = pinned
  const tailHeights = React.useRef(new Map<TailKey, number>())
  const observer = React.useRef<ResizeObserver | null>(null)
  const refCache = React.useRef(new Map<TailKey, (element: HTMLDivElement | null) => void>())

  const applyTailSpace = React.useCallback(() => {
    const element = scroller.current
    if (!element) return
    const index = pinnedRef.current
    if (index === null) {
      element.style.removeProperty(TAIL_SPACE_VAR)
      return
    }
    let tail = 0
    for (const [key, height] of tailHeights.current)
      if (key === 'footer' || key >= index) tail += height
    const space = Math.max(0, element.clientHeight - pinOffsetRef.current - tail)
    element.style.setProperty(TAIL_SPACE_VAR, `${space}px`)
    // Wait until tail space exists before scrolling, otherwise the scroll limit prevents alignment.
    // With space filling the viewport, pinning the message to the top equals reaching the bottom. Smooth-scroll the DOM directly
    // because Virtuoso scrollToIndex can delay and repeat movement while remeasuring.
    if (pending.current?.target === 'pin') {
      const behavior = pending.current.behavior
      pending.current = null
      requestAnimationFrame(() => scrollToEnd(behavior))
    }
  }, [scrollToEnd])

  const ensureObserver = React.useCallback(() => {
    if (observer.current || typeof ResizeObserver === 'undefined') return observer.current
    observer.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const key = (entry.target as HTMLElement).dataset.chatTail
        if (key === undefined || key === 'viewport') continue
        tailHeights.current.set(key === 'footer' ? 'footer' : Number(key), entry.contentRect.height)
      }
      applyTailSpace()
    })
    return observer.current
  }, [applyTailSpace])

  /**
   * Stable ref callbacks per key prevent observer churn. Retain the last measured height of virtualized, unmounted items so tail space does not grow while reading earlier messages.
   */
  const tailRef = React.useCallback(
    (key: TailKey) => {
      let callback = refCache.current.get(key)
      if (!callback) {
        let observed: HTMLDivElement | null = null
        callback = (element) => {
          const ro = ensureObserver()
          if (observed) ro?.unobserve(observed)
          observed = element
          if (element) {
            element.dataset.chatTail = String(key)
            ro?.observe(element)
          }
        }
        refCache.current.set(key, callback)
      }
      return callback
    },
    [ensureObserver]
  )

  React.useEffect(() => {
    const ro = observer.current
    return () => ro?.disconnect()
  }, [])

  // Remeasure tail space when the viewport changes, including keyboard and window resizing.
  const setScroller = React.useCallback(
    (element: HTMLElement | Window | null) => {
      scroller.current = element instanceof HTMLElement ? element : null
      if (scroller.current) {
        scroller.current.dataset.chatTail = 'viewport'
        ensureObserver()?.observe(scroller.current)
      }
    },
    [ensureObserver]
  )
  const composedScrollerRef = useComposedRefs(ref, setScroller as React.RefCallback<HTMLDivElement>)

  React.useEffect(() => {
    if (mode !== 'assistant') setPinned(null)
  }, [mode])
  React.useEffect(() => {
    applyTailSpace()
  }, [pinned, pinOffset, applyTailSpace])
  // Release the pin when a replacement conversation is shorter. Prefer remounting with key when switching conversations.
  const count = items.length
  if (pinned !== null && pinned >= count) setPinned(null)

  // Choose scroll intent when new messages arrive.
  // Do not use Virtuoso followOutput: it only runs when its own atBottom is true and skips an in-progress scroll.
  // The layout effect always observes count changes, but Virtuoso renders new item DOM on its next pass;
  // adjust immediately, again after height stabilizes in scrollToEnd, and after totalListHeightChanged measurement.
  const prevCount = React.useRef(items.length)
  useLayoutEffect(() => {
    const added = count - prevCount.current
    const wasEmpty = prevCount.current === 0
    prevCount.current = count
    if (added <= 0) return
    const list = itemsRef.current
    if (wasEmpty) {
      // Initial history load: jump immediately to the latest message.
      scrollToEnd('auto')
      return
    }
    if (isOwnRef.current(list[count - 1])) {
      setListState((state) => (state.unread === 0 ? state : { ...state, unread: 0 }))
      if (mode === 'assistant') {
        // Pin after applyTailSpace creates room, then smooth-scroll upward and suspend bottom following during movement.
        pinning.current = true
        window.clearTimeout(pinningTimer.current)
        pinningTimer.current = window.setTimeout(() => {
          pinning.current = false
        }, 1500)
        pending.current = { target: 'pin', behavior: 'smooth' }
        for (const key of [...tailHeights.current.keys()])
          if (key !== 'footer') tailHeights.current.delete(key)
        setPinned(count - 1)
        return
      }
      scrollToEnd('smooth')
      return
    }
    if (atBottomRef.current || following.current) {
      scrollToEnd('smooth')
      return
    }
    setListState((state) => ({ ...state, unread: state.unread + added }))
  }, [count, mode, scrollToEnd, setListState])

  const onTotalListHeightChanged = React.useCallback(() => {
    const element = scroller.current
    if (!element) return
    // A new own message in assistant mode must be pinned. This child effect may run before our layout effect schedules it,
    // so skip bottom following whenever an own message is not yet pinned, regardless of the pending flag.
    const list = itemsRef.current
    const last = list.length - 1
    const ownLanding =
      modeRef.current === 'assistant' &&
      last >= 0 &&
      isOwnRef.current(list[last]) &&
      (pinnedRef.current !== last || pinning.current)
    if (pending.current?.target === 'pin') {
      // The final height including tail space determines the target; without it, the scroll limit prevents alignment.
      if (element.style.getPropertyValue(TAIL_SPACE_VAR)) {
        const behavior = pending.current.behavior
        pending.current = null
        scrollToEnd(behavior)
      }
    } else if (!ownLanding && (atBottomRef.current || following.current)) {
      // Follow a growing last message at the bottom, including streamed answers and image loads.
      element.scrollTop = element.scrollHeight - element.clientHeight
    }
  }, [scrollToEnd])

  const onAtBottomStateChange = React.useCallback(
    (atBottom: boolean) => {
      atBottomRef.current = atBottom
      if (atBottom) {
        following.current = false
        window.clearTimeout(followingTimer.current)
        // Tail space fills the viewport, so completing the pin also reaches the bottom.
        pinning.current = false
        window.clearTimeout(pinningTimer.current)
      }
      setListState((state) => ({
        settled: state.settled || atBottom,
        atBottom,
        unread: atBottom ? 0 : state.unread,
      }))
    },
    [setListState]
  )

  useLayoutEffect(() => {
    listHandle.current = { scrollToBottom: scrollToEnd }
    return () => {
      listHandle.current = null
    }
  }, [listHandle, scrollToEnd])

  const listContext = React.useMemo<ListContext>(
    () => ({ header, footer, footerRef: tailRef('footer'), pinned, tailRef }),
    [header, footer, pinned, tailRef]
  )

  const computeItemKey = React.useCallback(
    (index: number, item: T) => (itemKey ? itemKey(item, index) : defaultKey(item, index)),
    [itemKey]
  )
  const itemContent = React.useCallback(
    (index: number, item: T) => children(item, index),
    [children]
  )

  if (items.length === 0 && empty !== undefined) return <>{empty}</>

  return (
    <Virtuoso<T, ListContext>
      ref={virtuoso}
      scrollerRef={composedScrollerRef as (ref: HTMLElement | Window | null) => void}
      data={items}
      context={listContext}
      computeItemKey={computeItemKey}
      itemContent={itemContent}
      components={LIST_COMPONENTS as never}
      initialTopMostItemIndex={{ index: 'LAST', align: 'end' }}
      alignToBottom={mode === 'messenger'}
      atBottomThreshold={atBottomThreshold}
      atBottomStateChange={onAtBottomStateChange}
      followOutput={false}
      totalListHeightChanged={onTotalListHeightChanged}
      increaseViewportBy={{ top: overscan, bottom: overscan }}
      data-mode={mode}
      {...props}
    />
  )
}
ChatList.displayName = LIST_NAME

/*
 * ChatScrollToBottom renders only away from the bottom.
 */

const SCROLL_TO_BOTTOM_NAME = 'ChatScrollToBottom'

type ChatScrollState = { unread: number; atBottom: boolean }
interface ChatScrollToBottomProps extends Omit<PrimitiveButtonProps, 'children'> {
  /** Render even at the bottom for consumer-controlled visibility. */
  forceMount?: true
  behavior?: ScrollBehaviorOption
  children?: React.ReactNode | ((state: ChatScrollState) => React.ReactNode)
}

const ChatScrollToBottom = React.forwardRef<HTMLButtonElement, ChatScrollToBottomProps>(
  (props, forwardedRef) => {
    const { forceMount, behavior = 'smooth', children, ...buttonProps } = props
    const state = useChatStateContext(SCROLL_TO_BOTTOM_NAME)
    // Hide during initial scrolling until the first bottom arrival to prevent a button flash.
    if (!forceMount && (!state.settled || state.atBottom)) return null
    const content =
      typeof children === 'function'
        ? children({ unread: state.unread, atBottom: state.atBottom })
        : children
    return (
      <Primitive.button
        type="button"
        data-unread={state.unread}
        data-state={state.atBottom ? 'at-bottom' : 'away'}
        {...buttonProps}
        ref={forwardedRef}
        onClick={composeEventHandlers(props.onClick, () => state.scrollToBottom(behavior))}
      >
        {content}
      </Primitive.button>
    )
  }
)
ChatScrollToBottom.displayName = SCROLL_TO_BOTTOM_NAME

/*
 * ChatMessage, ChatMessageContent, and ChatBubble expose alignment and tone through data attributes.
 */

const MESSAGE_NAME = 'ChatMessage'

type ChatMessageContextValue = { align: ChatAlign; tone: ChatTone }
const [ChatMessageProvider, useChatMessageContext] = createContext<ChatMessageContextValue>(
  MESSAGE_NAME,
  { align: 'start', tone: 'muted' }
)

interface ChatMessageProps extends PrimitiveDivProps {
  /** end is the user's message; start is another participant or the assistant. */
  align?: ChatAlign
  /** Default bubble tone for this message; otherwise derived from alignment and mode. */
  tone?: ChatTone
}

const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>((props, forwardedRef) => {
  const { align = 'start', tone: toneProp, ...messageProps } = props
  const root = useChatRootContext(MESSAGE_NAME, { optional: true })
  const mode = root?.mode ?? 'messenger'
  const tone: ChatTone =
    toneProp ?? (align === 'end' ? 'primary' : mode === 'assistant' ? 'plain' : 'muted')
  return (
    <ChatMessageProvider align={align} tone={tone}>
      <Primitive.div data-align={align} data-tone={tone} {...messageProps} ref={forwardedRef} />
    </ChatMessageProvider>
  )
})
ChatMessage.displayName = MESSAGE_NAME

const MESSAGE_CONTENT_NAME = 'ChatMessageContent'

/** Vertical bubble/metadata stack beside the avatar, inheriting alignment and tone. */
const ChatMessageContent = React.forwardRef<HTMLDivElement, PrimitiveDivProps>(
  (props, forwardedRef) => {
    const { align, tone } = useChatMessageContext(MESSAGE_CONTENT_NAME)
    return <Primitive.div data-align={align} data-tone={tone} {...props} ref={forwardedRef} />
  }
)
ChatMessageContent.displayName = MESSAGE_CONTENT_NAME

const BUBBLE_NAME = 'ChatBubble'

interface ChatBubbleProps extends PrimitiveDivProps {
  /** Override the message's default tone. */
  tone?: ChatTone
}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>((props, forwardedRef) => {
  const { tone: toneProp, ...bubbleProps } = props
  const message = useChatMessageContext(BUBBLE_NAME)
  const tone = toneProp ?? message.tone
  return (
    <Primitive.div
      data-align={message.align}
      data-tone={tone}
      {...bubbleProps}
      ref={forwardedRef}
    />
  )
})
ChatBubble.displayName = BUBBLE_NAME

/*
 * ChatComposer: value, submission, keyboard handling, and pending state.
 */

const COMPOSER_NAME = 'ChatComposer'

type ChatComposerContextValue = {
  value: string
  setValue: (value: string) => void
  send: () => void
  canSend: boolean
  pending: boolean
  hasStop: boolean
  disabled: boolean
  submitOnEnter: boolean
  onStop?: () => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}
const [ChatComposerProvider, useChatComposerContext] =
  createContext<ChatComposerContextValue>(COMPOSER_NAME)

type PrimitiveFormProps = React.ComponentPropsWithoutRef<typeof Primitive.form>
interface ChatComposerProps extends Omit<PrimitiveFormProps, 'onSubmit' | 'defaultValue'> {
  /** Controlled value; omit for internal state. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Receive trimmed text on send; clear input immediately after calling. */
  onSend?: (text: string) => void | Promise<void>
  /** Response generation is pending. With onStop, Stop replaces Submit. Enter still sends; consumers own queuing. */
  pending?: boolean
  onStop?: () => void
  disabled?: boolean
  /** Default: Enter sends and Shift+Enter inserts a newline. false requires Cmd/Ctrl+Enter to send. */
  submitOnEnter?: boolean
}

const ChatComposer = React.forwardRef<HTMLFormElement, ChatComposerProps>((props, forwardedRef) => {
  const {
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onSend,
    pending = false,
    onStop,
    disabled = false,
    submitOnEnter = true,
    ...formProps
  } = props
  const [inner, setInner] = React.useState(defaultValue)
  const value = valueProp ?? inner
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null)
  const onValueChangeRef = React.useRef(onValueChange)
  onValueChangeRef.current = onValueChange
  const onSendRef = React.useRef(onSend)
  onSendRef.current = onSend
  const valueRef = React.useRef(value)
  valueRef.current = value

  const setValue = React.useCallback(
    (next: string) => {
      if (valueProp === undefined) setInner(next)
      onValueChangeRef.current?.(next)
    },
    [valueProp]
  )
  const canSend = !disabled && value.trim().length > 0
  const send = React.useCallback(() => {
    const text = valueRef.current.trim()
    if (!text) return
    setValue('')
    void onSendRef.current?.(text)
    inputRef.current?.focus()
  }, [setValue])

  return (
    <ChatComposerProvider
      value={value}
      setValue={setValue}
      send={send}
      canSend={canSend}
      pending={pending}
      hasStop={Boolean(onStop)}
      disabled={disabled}
      submitOnEnter={submitOnEnter}
      onStop={onStop}
      inputRef={inputRef}
    >
      <Primitive.form
        data-pending={pending ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        {...formProps}
        ref={forwardedRef}
        onSubmit={(event) => {
          event.preventDefault()
          if (canSend) send()
        }}
      />
    </ChatComposerProvider>
  )
})
ChatComposer.displayName = COMPOSER_NAME

const COMPOSER_INPUT_NAME = 'ChatComposerInput'

interface ChatComposerInputProps extends Omit<TextareaProps, 'value' | 'defaultValue'> {
  /** Auto-grow to content by default, bounded by consumer CSS max-height. */
  autoGrow?: boolean
}

/** Composer textarea ignores send-on-Enter during Korean/Japanese IME composition, using isComposing or keyCode 229. */
function ChatComposerInput({
  autoGrow = true,
  rows = 1,
  disabled,
  ref,
  onChange,
  onKeyDown,
  ...props
}: ChatComposerInputProps) {
  const context = useChatComposerContext(COMPOSER_INPUT_NAME)
  const { value, setValue, send, submitOnEnter, inputRef } = context
  const composedRef = useComposedRefs(ref, inputRef)

  // Resize to scrollHeight after value changes. CSS max-height caps the height and enables internal scrolling.
  useLayoutEffect(() => {
    const element = inputRef.current
    if (!autoGrow || !element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [value, autoGrow, inputRef])

  return (
    <Textarea
      rows={rows}
      value={value}
      disabled={disabled ?? context.disabled}
      data-pending={context.pending ? '' : undefined}
      {...props}
      ref={composedRef}
      onChange={composeEventHandlers(onChange, (event) => setValue(event.currentTarget.value))}
      onKeyDown={composeEventHandlers(onKeyDown, (event) => {
        if (event.key !== 'Enter') return
        // Enter commits IME composition; Safari reports this only through keyCode 229.
        if (event.nativeEvent.isComposing || event.keyCode === 229) return
        const modifier = event.metaKey || event.ctrlKey
        if (modifier || (submitOnEnter && !event.shiftKey && !event.altKey)) {
          event.preventDefault()
          send()
        }
      })}
    />
  )
}
ChatComposerInput.displayName = COMPOSER_INPUT_NAME

const COMPOSER_SUBMIT_NAME = 'ChatComposerSubmit'

interface ChatComposerSubmitProps extends PrimitiveButtonProps {
  /** Render even while Stop occupies the pending slot. */
  forceMount?: true
}

/** Submit is disabled when sending is unavailable and yields to Stop when pending with onStop. */
const ChatComposerSubmit = React.forwardRef<HTMLButtonElement, ChatComposerSubmitProps>(
  (props, forwardedRef) => {
    const { forceMount, disabled, ...buttonProps } = props
    const { canSend, pending, hasStop } = useChatComposerContext(COMPOSER_SUBMIT_NAME)
    if (!forceMount && pending && hasStop) return null
    const isDisabled = disabled || !canSend
    return (
      <Primitive.button
        type="submit"
        disabled={isDisabled}
        data-disabled={isDisabled ? '' : undefined}
        {...buttonProps}
        ref={forwardedRef}
      />
    )
  }
)
ChatComposerSubmit.displayName = COMPOSER_SUBMIT_NAME

const COMPOSER_STOP_NAME = 'ChatComposerStop'

interface ChatComposerStopProps extends PrimitiveButtonProps {
  forceMount?: true
}

/** Stop renders only while pending with an onStop callback. */
const ChatComposerStop = React.forwardRef<HTMLButtonElement, ChatComposerStopProps>(
  (props, forwardedRef) => {
    const { forceMount, ...buttonProps } = props
    const { pending, hasStop, onStop } = useChatComposerContext(COMPOSER_STOP_NAME)
    if (!forceMount && !(pending && hasStop)) return null
    return (
      <Primitive.button
        type="button"
        {...buttonProps}
        ref={forwardedRef}
        onClick={composeEventHandlers(props.onClick, () => onStop?.())}
      />
    )
  }
)
ChatComposerStop.displayName = COMPOSER_STOP_NAME

/* ---------------------------------------------------------------------------------------------- */

const Root = ChatRoot
const Title = ChatTitle
const Description = ChatDescription
const List = ChatList
const ScrollToBottom = ChatScrollToBottom
const Message = ChatMessage
const MessageContent = ChatMessageContent
const Bubble = ChatBubble
const Composer = ChatComposer
const ComposerInput = ChatComposerInput
const ComposerSubmit = ChatComposerSubmit
const ComposerStop = ChatComposerStop

export {
  ChatRoot,
  ChatTitle,
  ChatDescription,
  ChatList,
  ChatScrollToBottom,
  ChatMessage,
  ChatMessageContent,
  ChatBubble,
  ChatComposer,
  ChatComposerInput,
  ChatComposerSubmit,
  ChatComposerStop,
  //
  Root,
  Title,
  Description,
  List,
  ScrollToBottom,
  Message,
  MessageContent,
  Bubble,
  Composer,
  ComposerInput,
  ComposerSubmit,
  ComposerStop,
}
export type {
  ChatMode,
  ChatAlign,
  ChatTone,
  ChatRootProps,
  ChatListProps,
  ChatScrollToBottomProps,
  ChatScrollState,
  ChatMessageProps,
  ChatBubbleProps,
  ChatComposerProps,
  ChatComposerInputProps,
  ChatComposerSubmitProps,
  ChatComposerStopProps,
}
