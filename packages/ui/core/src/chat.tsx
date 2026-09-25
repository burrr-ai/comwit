'use client'

/**
 * comwit-ui — chat 프리미티브 (헤드리스 · 스타일 0 · 앱 비의존).
 *
 * 대화 화면의 **동작**을 전부 소유한다. 시각은 소비 레이어(@comwit/ui-templates chat.tsx)가 className 과
 * data-* 로 입힌다.
 *
 *  - List         react-virtuoso 가상화 + `mode` 별 스크롤 규칙 + 안 읽음 카운트 + 처음 열 때 마지막 메시지.
 *                   messenger  내 메시지는 언제나 바닥으로, 상대 메시지는 바닥에 있을 때만 따라간다.
 *                   assistant  내 메시지를 뷰포트 상단에 붙이고(아래는 --chat-tail-space 여백) 답변이 그 밑에 흐른다.
 *  - ScrollToBottom 바닥이 아닐 때만 렌더되는 버튼. data-unread 로 안 읽은 개수를 알린다.
 *  - Message/Bubble 정렬·톤을 data-align / data-tone 으로 방출한다(end → primary · start → muted · assistant 는 plain).
 *  - Composer     값(제어/비제어)·전송·Enter/Shift+Enter·IME 조합 가드·자동 높이·pending ↔ Stop 전환.
 *
 *   <Chat.Root mode="messenger">
 *     <Chat.Title>Ava</Chat.Title>
 *     <Chat.List items={messages} isOwn={(m) => m.mine}>
 *       {(m) => (
 *         <Chat.Message align={m.mine ? 'end' : 'start'}>
 *           <Chat.MessageContent><Chat.Bubble>{m.text}</Chat.Bubble></Chat.MessageContent>
 *         </Chat.Message>
 *       )}
 *     </Chat.List>
 *     <Chat.ScrollToBottom>{({ unread }) => (unread ? `${unread} new` : '↓')}</Chat.ScrollToBottom>
 *     <Chat.Composer onSend={send} pending={streaming} onStop={stop}>
 *       <Chat.ComposerInput />
 *       <Chat.ComposerStop>■</Chat.ComposerStop>
 *       <Chat.ComposerSubmit>↑</Chat.ComposerSubmit>
 *     </Chat.Composer>
 *   </Chat.Root>
 *
 * data-* (소비 CSS 훅): Root data-mode · ScrollToBottom data-unread/data-state · Message·MessageContent·Bubble
 * data-align/data-tone · Composer data-pending/data-disabled · ComposerSubmit data-disabled.
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

// 두 컨텍스트로 나눈다 — List 는 안정된 Root 컨텍스트만 읽고 상태를 "쓴다". 바닥/안 읽음 상태가 바뀔 때
// 리렌더되는 건 그걸 읽는 ScrollToBottom 뿐이다(목록 자체는 다시 그리지 않는다).
const [ChatRootProvider, useChatRootContext] = createContext<ChatRootContextValue>(CHAT_NAME)
const [ChatStateProvider, useChatStateContext] = createContext<ChatStateContextValue>(CHAT_NAME)

interface ChatRootProps extends PrimitiveDivProps {
  /** 스크롤 규칙과 말풍선 기본 톤. `List` 의 `mode` 로 개별 덮기 가능. */
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

/* -------------------------------------------------------------------------------------------------
 * ChatTitle · ChatDescription — Root 의 접근성 이름/설명
 * -----------------------------------------------------------------------------------------------*/

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

/* -------------------------------------------------------------------------------------------------
 * ChatList — 가상화 + 스크롤 규칙
 * -----------------------------------------------------------------------------------------------*/

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
  /** 메시지 하나를 그린다. */
  children: (item: T, index: number) => React.ReactNode
  /** 리스트 키. 기본은 `item.id`, 없으면 index. */
  itemKey?: (item: T, index: number) => React.Key
  /** "내가 보낸 메시지" 판정 — 스크롤 규칙이 이걸 본다. 기본 `item.role === 'user'`. */
  isOwn?: (item: T) => boolean
  /** `Root` 의 mode 를 덮는다. */
  mode?: ChatMode
  /** 메시지가 하나도 없을 때 목록 대신 그릴 내용. */
  empty?: React.ReactNode
  /** 첫 메시지 위에 붙는 내용(여백 등). 목록과 함께 스크롤된다. */
  header?: React.ReactNode
  /** 마지막 메시지 아래에 붙는 내용(타이핑 표시 등). 가상화 밖이라 항상 그려진다. */
  footer?: React.ReactNode
  /** assistant 모드에서 상단에 붙는 메시지와 뷰포트 윗변 사이 간격(px). 기본 0. */
  pinOffset?: number
  /** 바닥 판정 여유(px). 기본 24. */
  atBottomThreshold?: number
  /** 뷰포트 위·아래로 미리 그려 두는 높이(px). 기본 320. */
  overscan?: number
  /** 스크롤러 요소. */
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

// Virtuoso 의 Header/Footer/Item 은 안정된 컴포넌트여야 한다(바뀌면 리마운트) — 내용은 context 로 흘린다.
function ListHeader({ context }: { context?: ListContext }) {
  return <>{context?.header ?? null}</>
}
function ListFooter({ context }: { context?: ListContext }) {
  return (
    <>
      <div ref={context?.footerRef}>{context?.footer}</div>
      {/* assistant 모드가 내 메시지를 상단에 붙일 때 아래를 채우는 빈 공간. 변수는 스크롤러에 산다. */}
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

  // ── assistant 모드: 상단에 붙인 내 메시지(pinned) 아래를 채우는 여백 ──
  // pinned 인덱스부터 끝까지(+ footer)의 높이를 재서, 뷰포트에서 남는 만큼을 --chat-tail-space 로 준다.
  // 답변이 길어지면 여백이 그만큼 줄어 총 높이가 그대로다 → 스크롤이 튀지 않는다. 리렌더 없이 CSS 변수만 움직인다.
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
    // 여백이 실제로 생긴 뒤에 붙여야 맨 위까지 올라간다(그 전엔 스크롤 한계에 걸린다).
    if (pending.current?.target === 'pin') {
      const behavior = pending.current.behavior
      pending.current = null
      requestAnimationFrame(() =>
        virtuoso.current?.scrollToIndex({ index: 'LAST', align: 'start', behavior })
      )
    }
  }, [])

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
   * 키별로 안정된 ref 콜백 — 매 렌더 새 함수를 주면 옵저버가 붙었다 떨어지길 반복한다.
   * 가상화로 내려간(언마운트) 항목의 높이는 지우지 않고 마지막 값을 쓴다 — 지우면 위로 올라가 읽는 동안 여백이 부푼다.
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

  // 뷰포트 크기가 바뀌면(키보드·창 크기) 여백도 다시 잰다.
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
  // 목록이 통째로 바뀌어 짧아지면(다른 대화) 붙임을 푼다. 대화를 바꿀 땐 `key` 로 리마운트하는 편이 낫다.
  const count = items.length
  if (pinned !== null && pinned >= count) setPinned(null)

  // ── 바닥으로 내려가기 — DOM 이 안정된 뒤에 실제 scrollHeight 로 ──
  // Virtuoso 의 내부 총높이는 같은 커밋에서 푸터(타이핑 표시)가 사라지고 항목이 붙으면 한 박자 늦게 맞는다.
  // 그래서 목표는 Virtuoso 의 인덱스 계산이 아니라 스크롤러의 실제 높이로 잡고, 높이가 두 프레임 연속 같아질 때 내린다.
  // 커밋 직후의 DOM 높이로 즉시 내리고(백그라운드 탭에서 rAF 가 1fps 로 늦어져도 바닥은 맞는다), 높이가 두 프레임
  // 연속 같아지면(이미지 로드 등) 한 번 더 맞춘다. 내려가는 동안(`following`) 온 메시지는 안 읽음으로 세지 않는다.
  const scrollFrame = React.useRef(0)
  const following = React.useRef(false)
  const followingTimer = React.useRef(0)
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
    },
    []
  )

  // ── 새 메시지가 붙으면 스크롤 의도를 정한다 ──
  // Virtuoso 의 followOutput 은 자기 atBottom 판정이 참일 때만 불려(내려가는 도중엔 아예 안 온다) 쓰지 않는다.
  // 개수 변화는 레이아웃 이펙트가 항상 본다. 새 항목의 DOM 은 Virtuoso 가 다음 렌더에서 그리므로,
  // 이동은 즉시 한 번 + 높이가 안정된 뒤 한 번 더(scrollToEnd) · 잰 뒤 한 번 더(totalListHeightChanged) 맞춘다.
  const prevCount = React.useRef(items.length)
  useLayoutEffect(() => {
    const added = count - prevCount.current
    const wasEmpty = prevCount.current === 0
    prevCount.current = count
    if (added <= 0) return
    const list = itemsRef.current
    if (wasEmpty) {
      // 처음 채워지는 목록(히스토리 로드) — 마지막 메시지로 즉시.
      scrollToEnd('auto')
      return
    }
    if (isOwnRef.current(list[count - 1])) {
      setListState((state) => (state.unread === 0 ? state : { ...state, unread: 0 }))
      if (mode === 'assistant') {
        // 상단 고정 — 여백(applyTailSpace)이 생긴 뒤 그쪽이 붙인다.
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
    const handle = virtuoso.current
    const element = scroller.current
    if (pending.current?.target === 'pin') {
      // 여백까지 반영된 높이 변화가 최종 위치를 정한다(여백 전엔 스크롤 한계에 걸린다).
      if (handle && element?.style.getPropertyValue(TAIL_SPACE_VAR)) {
        const behavior = pending.current.behavior
        pending.current = null
        handle.scrollToIndex({ index: 'LAST', align: 'start', behavior })
      }
    } else if ((atBottomRef.current || following.current) && element) {
      // 바닥에서 마지막 메시지가 자라면(스트리밍 답변·이미지 로드) 따라간다.
      element.scrollTop = element.scrollHeight - element.clientHeight
    }
  }, [])

  const onAtBottomStateChange = React.useCallback(
    (atBottom: boolean) => {
      atBottomRef.current = atBottom
      if (atBottom) {
        following.current = false
        window.clearTimeout(followingTimer.current)
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

/* -------------------------------------------------------------------------------------------------
 * ChatScrollToBottom — 바닥이 아닐 때만 렌더되는 버튼
 * -----------------------------------------------------------------------------------------------*/

const SCROLL_TO_BOTTOM_NAME = 'ChatScrollToBottom'

type ChatScrollState = { unread: number; atBottom: boolean }
interface ChatScrollToBottomProps extends Omit<PrimitiveButtonProps, 'children'> {
  /** 바닥에 있어도 렌더한다(직접 숨김 처리할 때). */
  forceMount?: true
  behavior?: ScrollBehaviorOption
  children?: React.ReactNode | ((state: ChatScrollState) => React.ReactNode)
}

const ChatScrollToBottom = React.forwardRef<HTMLButtonElement, ChatScrollToBottomProps>(
  (props, forwardedRef) => {
    const { forceMount, behavior = 'smooth', children, ...buttonProps } = props
    const state = useChatStateContext(SCROLL_TO_BOTTOM_NAME)
    // 첫 바닥 도달 전(마운트 직후 초기 스크롤 중)에는 그리지 않는다 — 이때 버튼이 깜빡이지 않게.
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

/* -------------------------------------------------------------------------------------------------
 * ChatMessage · ChatMessageContent · ChatBubble — 정렬과 톤을 data-* 로
 * -----------------------------------------------------------------------------------------------*/

const MESSAGE_NAME = 'ChatMessage'

type ChatMessageContextValue = { align: ChatAlign; tone: ChatTone }
const [ChatMessageProvider, useChatMessageContext] = createContext<ChatMessageContextValue>(
  MESSAGE_NAME,
  { align: 'start', tone: 'muted' }
)

interface ChatMessageProps extends PrimitiveDivProps {
  /** end = 내 메시지 · start = 상대/AI. */
  align?: ChatAlign
  /** 이 메시지 안 말풍선의 기본 톤. 생략하면 정렬과 모드가 정한다. */
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

/** 아바타 옆에 서는 세로 묶음(말풍선 · 메타). 정렬·톤을 그대로 물려받는다. */
const ChatMessageContent = React.forwardRef<HTMLDivElement, PrimitiveDivProps>(
  (props, forwardedRef) => {
    const { align, tone } = useChatMessageContext(MESSAGE_CONTENT_NAME)
    return <Primitive.div data-align={align} data-tone={tone} {...props} ref={forwardedRef} />
  }
)
ChatMessageContent.displayName = MESSAGE_CONTENT_NAME

const BUBBLE_NAME = 'ChatBubble'

interface ChatBubbleProps extends PrimitiveDivProps {
  /** 메시지의 기본 톤을 덮는다. */
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

/* -------------------------------------------------------------------------------------------------
 * ChatComposer — 값 · 전송 · 키보드 · pending
 * -----------------------------------------------------------------------------------------------*/

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
  /** 제어형 값. 생략하면 내부 상태. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** 보내기 — 트림한 텍스트를 받는다. 호출 직후 입력은 비워진다. */
  onSend?: (text: string) => void | Promise<void>
  /** 답변 생성 중. `onStop` 이 있으면 Submit 대신 Stop 이 렌더된다. Enter 는 그대로 보낸다(큐잉은 소비처 몫). */
  pending?: boolean
  onStop?: () => void
  disabled?: boolean
  /** Enter 로 보내고 Shift+Enter 로 줄바꿈(기본). false 면 ⌘/Ctrl+Enter 로만 보낸다. */
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
  /** 내용에 맞춰 높이를 자동으로 키운다(기본). 상한은 소비 CSS 의 max-height 가 잡는다. */
  autoGrow?: boolean
}

/** 컴포저의 textarea. Enter 보내기는 한글·일본어 조합 중(isComposing / keyCode 229)엔 무시한다. */
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

  // 값이 바뀔 때마다 scrollHeight 로 높이를 맞춘다. CSS max-height 가 상한을 잡고 넘치면 안에서 스크롤.
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
        // 조합 중의 Enter 는 조합 확정이다(Safari 는 keyCode 229 로만 알린다).
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
  /** pending 중 Stop 이 자리를 차지해도 렌더한다. */
  forceMount?: true
}

/** 보내기 버튼(submit). 보낼 수 없으면 disabled, `pending` + `onStop` 이면 Stop 에 자리를 내준다. */
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

/** 중단 버튼. `pending` 이고 `onStop` 이 있을 때만 렌더된다. */
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
