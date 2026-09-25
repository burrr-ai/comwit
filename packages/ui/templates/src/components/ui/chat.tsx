'use client'

/**
 * Chat — 헤더 · 메시지 · 컴포저의 세로 3단. 부모를 꽉 채운다(부모에 높이가 있어야 한다: `h-dvh`, `flex-1 min-h-0`).
 *
 * 메시지 목록은 가상화한다(엔진 react-virtuoso) — 수천 개여도 DOM 은 보이는 것만. 스크롤 규칙은 `mode` 가 정한다:
 *
 *   messenger  사람과의 대화. 내 메시지는 언제나 바닥으로 내려가고, 상대 메시지는 바닥에 있을 때만 따라간다.
 *              위로 올라가 읽는 중이면 "New messages" 알약이 뜬다.
 *   assistant  AI 와의 대화. 내 메시지를 보내면 그 메시지가 **맨 위로 올라가 붙고**, 답변이 그 밑에서 흘러내린다.
 *              (아래 빈 공간은 답변이 채운다.) 답변이 화면을 넘기면 바닥에 있을 때만 따라간다.
 *
 * 두 모드 모두 처음 열면 마지막 메시지에서 시작한다. 데이터 모양은 강제하지 않는다 — `items` 는 무엇이든 되고,
 * `isOwn` 이 "내가 보낸 메시지" 를 가른다(기본은 `role === 'user'`).
 *
 *   <Chat mode="messenger">
 *     <ChatHeader>
 *       <Avatar>…</Avatar>
 *       <div className="min-w-0 flex-1"><ChatTitle>Ava</ChatTitle><ChatDescription>Active now</ChatDescription></div>
 *     </ChatHeader>
 *     <ChatMessages items={messages} isOwn={(m) => m.mine}>
 *       {(m) => (
 *         <ChatMessage align={m.mine ? 'end' : 'start'}>
 *           <ChatBubble>{m.text}</ChatBubble>
 *           <ChatMessageMeta>{m.time}</ChatMessageMeta>
 *         </ChatMessage>
 *       )}
 *     </ChatMessages>
 *     <ChatComposer onSend={send} />
 *   </Chat>
 *
 * 색·반경·그림자는 전부 토큰이다 — 내 말풍선은 `bg-primary`, 상대는 `bg-muted`, 컴포저 면은 `rounded-sheet` + `shadow-message`.
 */

import * as React from 'react'
import { ArrowDown, ArrowUp, Square } from 'lucide-react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'

import { Button } from './button'
import { GlassButton } from './glass'
import { Textarea } from './textarea'
import { focusWithinField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

export type ChatMode = 'messenger' | 'assistant'

/** 바닥 판정 여유(px). 부드러운 스크롤·바운스 끝에서도 "바닥" 으로 본다. */
const AT_BOTTOM_THRESHOLD = 24
/** 목록 위·아래로 미리 그려 두는 높이(px) — 빠른 스크롤에서 빈 칸이 보이지 않게. */
const OVERSCAN = 320
/** 목록 상단 여백(px). assistant 모드에서 상단에 붙는 메시지가 헤더에 딱 붙지 않게 한다. */
const TOP_PADDING = 12
const TAIL_SPACE_VAR = '--chat-tail-space'

/* ── Root ─────────────────────────────────────────────────────── */

const ChatContext = React.createContext<{ mode: ChatMode }>({ mode: 'messenger' })

type ChatProps = React.ComponentProps<'section'> & {
  /** 스크롤 규칙과 말풍선 기본 톤을 정한다. `ChatMessages` 의 `mode` 로 개별 덮기 가능. */
  mode?: ChatMode
}

/** 세로 3단 컨테이너. 부모를 채우고(`h-full`), 자식 중 `ChatMessages` 만 늘어난다. */
function Chat({ mode = 'messenger', className, ...props }: ChatProps) {
  const value = React.useMemo(() => ({ mode }), [mode])
  return (
    <ChatContext.Provider value={value}>
      <section
        data-slot="chat"
        data-mode={mode}
        className={cn(
          'relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground',
          className
        )}
        {...props}
      />
    </ChatContext.Provider>
  )
}

/* ── Header ───────────────────────────────────────────────────── */

function ChatHeader({ className, ...props }: React.ComponentProps<'header'>) {
  return (
    <header
      data-slot="chat-header"
      className={cn(
        'flex h-appbar shrink-0 items-center gap-3 border-b border-border bg-background px-4',
        className
      )}
      {...props}
    />
  )
}

function ChatTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="chat-title"
      className={cn('min-w-0 truncate text-title-md text-foreground', className)}
      {...props}
    />
  )
}

function ChatDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="chat-description"
      className={cn('min-w-0 truncate text-caption text-muted-foreground', className)}
      {...props}
    />
  )
}

function ChatHeaderActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="chat-header-actions"
      className={cn('ml-auto flex shrink-0 items-center gap-1', className)}
      {...props}
    />
  )
}

/* ── Messages (virtualized) ───────────────────────────────────── */

type ChatMessagesLabels = {
  /** 바닥이 아닐 때 뜨는 버튼. 기본 "Jump to latest". */
  scrollToBottom?: string
  /** messenger 모드에서 안 읽은 메시지가 쌓였을 때. 기본 `n new messages`. */
  newMessages?: (count: number) => string
}

type ChatMessagesContextValue = {
  /** 첫 바닥 도달 전(마운트 직후 초기 스크롤 중)에는 false — 이때 버튼이 깜빡이지 않게 한다. */
  settled: boolean
  atBottom: boolean
  unread: number
  scrollToBottom: (behavior?: 'auto' | 'smooth') => void
  labels: Required<ChatMessagesLabels>
}

const ChatMessagesContext = React.createContext<ChatMessagesContextValue | null>(null)

type Pending = { target: 'bottom' | 'pin'; behavior: 'auto' | 'smooth' } | null

type ChatMessagesProps<T> = Omit<React.ComponentProps<'div'>, 'children'> & {
  items: readonly T[]
  /** 메시지 하나를 그린다. `ChatMessage` 로 감싸면 정렬·말풍선 톤이 따라온다. */
  children: (item: T, index: number) => React.ReactNode
  /** 리스트 키. 기본은 `item.id`, 없으면 index. */
  itemKey?: (item: T, index: number) => React.Key
  /** "내가 보낸 메시지" 판정 — 스크롤 규칙이 이걸 본다. 기본 `item.role === 'user'`. */
  isOwn?: (item: T) => boolean
  /** `Chat` 의 mode 를 덮는다. */
  mode?: ChatMode
  /** 메시지가 하나도 없을 때 가운데 놓을 내용(EmptyState 등). */
  empty?: React.ReactNode
  /** 마지막 메시지 아래에 붙는 내용 — 타이핑 표시(`<ChatTyping />`) 등. 가상화 밖이라 항상 그려진다. */
  footer?: React.ReactNode
  /** false 면 "Jump to latest" 버튼을 그리지 않는다. */
  scrollToBottomButton?: boolean
  labels?: ChatMessagesLabels
}

type ListContext = { footer: React.ReactNode; onFooterRef: (el: HTMLDivElement | null) => void }

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

const DEFAULT_LABELS: Required<ChatMessagesLabels> = {
  scrollToBottom: 'Jump to latest',
  newMessages: (n) => (n === 1 ? '1 new message' : `${n} new messages`),
}

// Virtuoso 의 Header/Footer 는 안정된 컴포넌트여야 한다(바뀌면 리마운트) — 내용은 context 로 흘린다.
function ListHeader() {
  return <div aria-hidden="true" style={{ height: TOP_PADDING }} />
}
function ListFooter({ context }: { context?: ListContext }) {
  return (
    <>
      <div ref={context?.onFooterRef}>{context?.footer}</div>
      {/* assistant 모드가 내 메시지를 상단에 붙일 때 아래를 채우는 빈 공간. --chat-tail-space 는 스크롤러에 산다. */}
      <div
        aria-hidden="true"
        style={{ height: `calc(var(${TAIL_SPACE_VAR}, 0px) + ${TOP_PADDING}px)` }}
      />
    </>
  )
}
const LIST_COMPONENTS = { Header: ListHeader, Footer: ListFooter }

function ChatMessages<T>({
  items,
  children,
  itemKey,
  isOwn = defaultIsOwn,
  mode: modeProp,
  empty,
  footer,
  scrollToBottomButton = true,
  labels: labelsProp,
  className,
  ...props
}: ChatMessagesProps<T>) {
  const { mode: contextMode } = React.useContext(ChatContext)
  const mode = modeProp ?? contextMode
  const labels = React.useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp }) as Required<ChatMessagesLabels>,
    [labelsProp]
  )

  const virtuoso = React.useRef<VirtuosoHandle>(null)
  const scroller = React.useRef<HTMLElement | null>(null)
  const atBottomRef = React.useRef(true)
  const [atBottom, setAtBottom] = React.useState(true)
  const [settled, setSettled] = React.useState(false)
  const [unread, setUnread] = React.useState(0)
  const pending = React.useRef<Pending>(null)
  const itemsRef = React.useRef(items)
  itemsRef.current = items
  const isOwnRef = React.useRef(isOwn)
  isOwnRef.current = isOwn

  // ── assistant 모드: 상단에 붙인 내 메시지(pinned) 아래를 채우는 여백 ──
  // pinned 인덱스부터 끝까지(+ footer)의 높이를 재서, 뷰포트에서 남는 만큼을 --chat-tail-space 로 준다.
  // 답변이 길어지면 여백이 그만큼 줄어 총 높이가 그대로다 → 스크롤이 튀지 않는다. 리렌더 없이 CSS 변수만 움직인다.
  const [pinned, setPinned] = React.useState<number | null>(null)
  const pinnedRef = React.useRef<number | null>(null)
  pinnedRef.current = pinned
  const tailHeights = React.useRef(new Map<number | 'footer', number>())
  const observer = React.useRef<ResizeObserver | null>(null)
  const refCache = React.useRef(new Map<number | 'footer', (el: HTMLDivElement | null) => void>())

  const applyTailSpace = React.useCallback(() => {
    const el = scroller.current
    if (!el) return
    const index = pinnedRef.current
    if (index === null) {
      el.style.removeProperty(TAIL_SPACE_VAR)
      return
    }
    let tail = 0
    for (const [key, height] of tailHeights.current)
      if (key === 'footer' || key >= index) tail += height
    const space = Math.max(0, el.clientHeight - TOP_PADDING * 2 - tail)
    el.style.setProperty(TAIL_SPACE_VAR, `${space}px`)
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
   * 인덱스별로 안정된 ref 콜백 — 매 렌더 새 함수를 주면 옵저버가 붙었다 떨어지길 반복한다.
   * 가상화로 내려간(언마운트) 항목의 높이는 지우지 않고 마지막 값을 쓴다 — 지우면 위로 올라가 읽는 동안 여백이 부푼다.
   */
  const tailRef = React.useCallback(
    (key: number | 'footer') => {
      let cb = refCache.current.get(key)
      if (!cb) {
        let observed: HTMLDivElement | null = null
        cb = (el) => {
          const ro = ensureObserver()
          if (observed) ro?.unobserve(observed)
          observed = el
          if (el) {
            el.dataset.chatTail = String(key)
            ro?.observe(el)
          }
        }
        refCache.current.set(key, cb)
      }
      return cb
    },
    [ensureObserver]
  )

  React.useEffect(() => {
    const ro = observer.current
    return () => ro?.disconnect()
  }, [])

  // 뷰포트 크기가 바뀌면(키보드·창 크기) 여백도 다시 잰다.
  const setScroller = React.useCallback(
    (el: HTMLElement | Window | null) => {
      scroller.current = el instanceof HTMLElement ? el : null
      if (scroller.current) {
        scroller.current.dataset.chatTail = 'viewport'
        ensureObserver()?.observe(scroller.current)
      }
    },
    [ensureObserver]
  )

  React.useEffect(() => {
    if (mode !== 'assistant') setPinned(null)
  }, [mode])
  React.useEffect(() => {
    applyTailSpace()
  }, [pinned, applyTailSpace])
  // 목록이 통째로 바뀌어 짧아지면(다른 대화) 붙임을 푼다. 대화를 바꿀 땐 `key` 로 리마운트하는 편이 낫다.
  const count = items.length
  if (pinned !== null && pinned >= count) setPinned(null)

  // ── 새 메시지가 붙으면 스크롤 의도를 정한다. 실제 이동은 Virtuoso 가 높이를 잰 뒤(totalListHeightChanged). ──
  const prevCount = React.useRef(items.length)
  React.useLayoutEffect(() => {
    const added = count - prevCount.current
    const wasEmpty = prevCount.current === 0
    prevCount.current = count
    if (added <= 0) return
    const last = itemsRef.current[count - 1]
    if (wasEmpty) {
      // 처음 채워지는 목록(히스토리 로드) — 마지막 메시지로 즉시.
      pending.current = { target: 'bottom', behavior: 'auto' }
      return
    }
    if (isOwnRef.current(last)) {
      setUnread(0)
      if (mode === 'assistant') {
        pending.current = { target: 'pin', behavior: 'smooth' }
        // 이전에 붙였던 항목들의 높이는 더 이상 합산 대상이 아니다.
        for (const key of [...tailHeights.current.keys()])
          if (key !== 'footer') tailHeights.current.delete(key)
        setPinned(count - 1)
      } else {
        pending.current = { target: 'bottom', behavior: 'smooth' }
      }
    } else if (atBottomRef.current) {
      pending.current = { target: 'bottom', behavior: 'smooth' }
    } else {
      setUnread((n) => n + added)
    }
  }, [count, mode])

  const onTotalListHeightChanged = React.useCallback(() => {
    const intent = pending.current
    const handle = virtuoso.current
    if (!handle) return
    if (intent?.target === 'bottom') {
      pending.current = null
      handle.scrollToIndex({ index: 'LAST', align: 'end', behavior: intent.behavior })
    } else if (intent?.target === 'pin') {
      // 여백(applyTailSpace)이 아직이면 그쪽이 붙인다. 여백까지 반영된 마지막 높이 변화가 최종 위치를 정한다.
      const el = scroller.current
      if (el?.style.getPropertyValue(TAIL_SPACE_VAR)) {
        pending.current = null
        handle.scrollToIndex({ index: 'LAST', align: 'start', behavior: intent.behavior })
      }
    } else if (atBottomRef.current) {
      // 바닥에서 마지막 메시지가 자라면(스트리밍 답변·이미지 로드) 따라간다.
      handle.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'auto' })
    }
  }, [])

  const onAtBottomStateChange = React.useCallback((value: boolean) => {
    atBottomRef.current = value
    setAtBottom(value)
    if (value) {
      setSettled(true)
      setUnread(0)
    }
  }, [])

  const scrollToBottom = React.useCallback((behavior: 'auto' | 'smooth' = 'smooth') => {
    virtuoso.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior })
  }, [])

  const contextValue = React.useMemo<ChatMessagesContextValue>(
    () => ({ settled, atBottom, unread, scrollToBottom, labels }),
    [settled, atBottom, unread, scrollToBottom, labels]
  )

  const listContext = React.useMemo<ListContext>(
    () => ({ footer, onFooterRef: tailRef('footer') }),
    [footer, tailRef]
  )

  const computeItemKey = React.useCallback(
    (index: number, item: T) => (itemKey ? itemKey(item, index) : defaultKey(item, index)),
    [itemKey]
  )

  const itemContent = React.useCallback(
    (index: number, item: T) => (
      <div
        data-slot="chat-item"
        ref={pinned !== null && index >= pinned ? tailRef(index) : undefined}
      >
        {children(item, index)}
      </div>
    ),
    [children, pinned, tailRef]
  )

  return (
    <ChatMessagesContext.Provider value={contextValue}>
      <div
        data-slot="chat-messages"
        data-mode={mode}
        className={cn('relative min-h-0 w-full flex-1', className)}
        {...props}
      >
        {items.length === 0 && empty !== undefined ? (
          <div className="flex h-full items-center justify-center p-6">{empty}</div>
        ) : (
          <Virtuoso<T, ListContext>
            ref={virtuoso}
            scrollerRef={setScroller}
            data={items as T[]}
            context={listContext}
            computeItemKey={computeItemKey}
            itemContent={itemContent}
            components={LIST_COMPONENTS}
            initialTopMostItemIndex={{ index: 'LAST', align: 'end' }}
            alignToBottom={mode === 'messenger'}
            atBottomThreshold={AT_BOTTOM_THRESHOLD}
            atBottomStateChange={onAtBottomStateChange}
            totalListHeightChanged={onTotalListHeightChanged}
            increaseViewportBy={{ top: OVERSCAN, bottom: OVERSCAN }}
            className="overflow-x-hidden overscroll-y-contain"
          />
        )}
        {scrollToBottomButton ? <ChatScrollToBottom /> : null}
      </div>
    </ChatMessagesContext.Provider>
  )
}

type ChatScrollToBottomProps = Omit<
  React.ComponentProps<typeof GlassButton>,
  'children' | 'shape'
> & { children?: React.ReactNode }

/**
 * 바닥이 아닐 때 목록 위에 뜨는 유리 버튼. 안 읽은 메시지가 있으면 개수를 단 알약이 된다.
 * `ChatMessages` 가 기본으로 그린다(`scrollToBottomButton={false}` 로 끄고 직접 놓을 수 있다).
 */
function ChatScrollToBottom({ className, children, onClick, ...props }: ChatScrollToBottomProps) {
  const list = React.useContext(ChatMessagesContext)
  if (!list || !list.settled || list.atBottom) return null
  const pill = list.unread > 0
  return (
    <div
      data-slot="chat-scroll-to-bottom"
      className="pointer-events-none absolute inset-x-0 bottom-3 z-raised flex justify-center animate-in fade-in-0 slide-in-from-bottom-2 duration-base"
    >
      <GlassButton
        shape={pill ? 'pill' : 'circle'}
        aria-label={pill ? undefined : list.labels.scrollToBottom}
        className={cn('pointer-events-auto', pill ? 'h-9 px-3.5' : 'size-10', className)}
        contentClassName={cn('text-label font-semibold', pill && 'gap-1.5')}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) list.scrollToBottom('smooth')
        }}
        {...props}
      >
        {children ?? (
          <>
            <ArrowDown className="size-4" strokeWidth={2.5} aria-hidden="true" />
            {pill ? <span>{list.labels.newMessages(list.unread)}</span> : null}
          </>
        )}
      </GlassButton>
    </div>
  )
}

/* ── Message · Bubble · Meta · Typing · Divider ───────────────── */

type ChatAlign = 'start' | 'end'
const ChatMessageContext = React.createContext<{ align: ChatAlign }>({ align: 'start' })

type ChatMessageProps = React.ComponentProps<'div'> & {
  /** end = 내 메시지(오른쪽) · start = 상대/AI(왼쪽). 말풍선 기본 톤도 여기서 정해진다. */
  align?: ChatAlign
  /** 말풍선 옆 아바타. 정렬에 따라 왼쪽/오른쪽에 붙는다. */
  avatar?: React.ReactNode
}

/** 메시지 한 줄 — 아바타 + (말풍선 · 메타) 세로 묶음. */
function ChatMessage({ align = 'start', avatar, className, children, ...props }: ChatMessageProps) {
  const { mode } = React.useContext(ChatContext)
  const value = React.useMemo(() => ({ align }), [align])
  // 사람 대화의 말풍선은 폭을 남겨 좌우가 구분되고, AI 답변(왼쪽·plain)은 문서처럼 전폭을 쓴다.
  const full = mode === 'assistant' && align === 'start'
  return (
    <ChatMessageContext.Provider value={value}>
      <div
        data-slot="chat-message"
        data-align={align}
        className={cn(
          'flex w-full items-end gap-2 px-4 py-1',
          align === 'end' && 'flex-row-reverse',
          className
        )}
        {...props}
      >
        {avatar ? (
          <div data-slot="chat-message-avatar" className="shrink-0 self-start">
            {avatar}
          </div>
        ) : null}
        <div
          data-slot="chat-message-content"
          className={cn(
            'flex min-w-0 flex-col gap-1',
            align === 'end' ? 'items-end' : 'items-start',
            full ? 'max-w-full flex-1' : 'max-w-[85%]'
          )}
        >
          {children}
        </div>
      </div>
    </ChatMessageContext.Provider>
  )
}

type ChatBubbleTone = 'primary' | 'muted' | 'plain'

type ChatBubbleProps = React.ComponentProps<'div'> & {
  /**
   * primary = 브랜드 면(내 메시지) · muted = 옅은 면(상대) · plain = 면 없음(AI 답변, 문서처럼 읽힌다).
   * 기본은 정렬과 모드가 정한다: end → primary, start → messenger 면 muted / assistant 면 plain.
   */
  tone?: ChatBubbleTone
}

function ChatBubble({ tone, className, ...props }: ChatBubbleProps) {
  const { align } = React.useContext(ChatMessageContext)
  const { mode } = React.useContext(ChatContext)
  const resolved: ChatBubbleTone =
    tone ?? (align === 'end' ? 'primary' : mode === 'assistant' ? 'plain' : 'muted')
  return (
    <div
      data-slot="chat-bubble"
      data-tone={resolved}
      className={cn(
        'min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap text-label leading-relaxed',
        resolved !== 'plain' && 'rounded-card px-3.5 py-2',
        // 보낸 쪽 아래 모서리만 살짝 각져 꼬리 느낌을 낸다.
        resolved !== 'plain' && (align === 'end' ? 'rounded-br-sm' : 'rounded-bl-sm'),
        resolved === 'primary' && 'bg-primary text-primary-foreground',
        resolved === 'muted' && 'bg-muted text-foreground',
        resolved === 'plain' && 'py-1 text-foreground',
        className
      )}
      {...props}
    />
  )
}

/** 시간·읽음 같은 메타 한 줄. 말풍선 아래, 정렬을 따라간다. */
function ChatMessageMeta({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="chat-message-meta"
      className={cn('px-1 text-micro text-muted-foreground', className)}
      {...props}
    />
  )
}

type ChatTypingProps = Omit<ChatBubbleProps, 'children'> & {
  /** 스크린리더용. 기본 "Typing". */
  label?: string
}

/** 입력 중 표시 — 점 셋이 번갈아 뛴다. 말풍선 톤을 그대로 따른다(assistant 모드에선 면 없이). */
function ChatTyping({ label = 'Typing', className, ...props }: ChatTypingProps) {
  return (
    <ChatBubble
      role="status"
      aria-label={label}
      data-slot="chat-typing"
      className={cn('inline-flex items-center gap-1 py-3', className)}
      {...props}
    >
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="size-1.5 animate-bounce rounded-full bg-current opacity-60"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </ChatBubble>
  )
}

/** 날짜·시스템 안내 같은 가운데 캡션. 메시지 하나로 넣거나 `footer` 에 둔다. */
function ChatDivider({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="separator"
      data-slot="chat-divider"
      className={cn(
        'px-4 py-2 text-center text-micro font-medium text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

/* ── Composer ─────────────────────────────────────────────────── */

type ChatComposerLabels = { send?: string; stop?: string }

type ChatComposerContextValue = {
  value: string
  setValue: (value: string) => void
  send: () => void
  canSend: boolean
  pending: boolean
  disabled: boolean
  placeholder?: string
  submitOnEnter: boolean
  onStop?: () => void
  labels: Required<ChatComposerLabels>
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}

const ChatComposerContext = React.createContext<ChatComposerContextValue | null>(null)

function useChatComposer(part: string) {
  const ctx = React.useContext(ChatComposerContext)
  if (!ctx) throw new Error(`<${part}> must be used inside <ChatComposer>.`)
  return ctx
}

type ChatComposerProps = Omit<React.ComponentProps<'form'>, 'onSubmit' | 'children'> & {
  /** 제어형 값. 생략하면 내부 상태. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** 보내기 — 트림한 텍스트를 받는다. 호출 직후 입력은 비워진다. */
  onSend?: (text: string) => void | Promise<void>
  /** 답변 생성 중 — 보내기 버튼이 중단 버튼으로 바뀐다(`onStop` 이 있을 때). Enter 는 그대로 보낸다(큐잉은 소비처 몫). */
  pending?: boolean
  onStop?: () => void
  disabled?: boolean
  placeholder?: string
  /** Enter 로 보내고 Shift+Enter 로 줄바꿈(기본). false 면 ⌘/Ctrl+Enter 로만 보낸다. */
  submitOnEnter?: boolean
  labels?: ChatComposerLabels
  /** 생략하면 기본 배치(입력 + 보내기 버튼). 직접 조립하려면 `ChatComposerInput` · `ChatComposerActions` · `ChatComposerSubmit`. */
  children?: React.ReactNode
}

const DEFAULT_COMPOSER_LABELS: Required<ChatComposerLabels> = { send: 'Send', stop: 'Stop' }

/** 하단 입력 면 — `rounded-sheet` 카드 하나가 보더·포커스 링을 그리고, 안의 textarea 는 bare 다. */
function ChatComposer({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onSend,
  pending = false,
  onStop,
  disabled = false,
  placeholder = 'Message',
  submitOnEnter = true,
  labels: labelsProp,
  className,
  children,
  ...props
}: ChatComposerProps) {
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

  const labels = React.useMemo(
    () => ({ ...DEFAULT_COMPOSER_LABELS, ...labelsProp }) as Required<ChatComposerLabels>,
    [labelsProp]
  )

  const ctx = React.useMemo<ChatComposerContextValue>(
    () => ({
      value,
      setValue,
      send,
      canSend,
      pending,
      disabled,
      placeholder,
      submitOnEnter,
      onStop,
      labels,
      inputRef,
    }),
    [value, setValue, send, canSend, pending, disabled, placeholder, submitOnEnter, onStop, labels]
  )

  return (
    <ChatComposerContext.Provider value={ctx}>
      <form
        data-slot="chat-composer"
        onSubmit={(event) => {
          event.preventDefault()
          if (canSend) send()
        }}
        className={cn(
          'shrink-0 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          className
        )}
        {...props}
      >
        <div
          data-slot="chat-composer-surface"
          aria-disabled={disabled || undefined}
          className={cn(
            'rounded-sheet border border-input bg-background p-2 shadow-message transition-[border-color,box-shadow] duration-fast',
            focusWithinField,
            disabled && 'bg-muted'
          )}
        >
          {children ?? (
            <>
              <ChatComposerInput />
              <ChatComposerActions>
                <ChatComposerSubmit />
              </ChatComposerActions>
            </>
          )}
        </div>
      </form>
    </ChatComposerContext.Provider>
  )
}

type ChatComposerInputProps = Omit<React.ComponentProps<typeof Textarea>, 'value' | 'bare'>

/**
 * 자동으로 자라는 한 줄 textarea(최대 `max-h-40`). Enter 보내기는 한글 조합 중(isComposing)엔 무시한다.
 * `ref`·`onPaste`·`onKeyDown` 같은 프롭은 그대로 합성된다.
 */
function ChatComposerInput({
  className,
  onChange,
  onKeyDown,
  ref,
  rows = 1,
  ...props
}: ChatComposerInputProps) {
  const ctx = useChatComposer('ChatComposerInput')
  const { value, setValue, send, disabled, placeholder, submitOnEnter, inputRef } = ctx

  const composed = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.RefObject<HTMLTextAreaElement | null>).current = node
    },
    [inputRef, ref]
  )

  // 값이 바뀔 때마다 scrollHeight 로 높이를 맞춘다. CSS max-height 가 상한을 잡고 넘치면 안에서 스크롤.
  React.useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value, inputRef])

  return (
    <Textarea
      bare
      ref={composed}
      rows={rows}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => {
        onChange?.(event)
        if (!event.defaultPrevented) setValue(event.target.value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.key !== 'Enter') return
        // 한글·일본어 조합 중의 Enter 는 조합 확정이다(Safari 는 keyCode 229 로만 알린다).
        if (event.nativeEvent.isComposing || event.keyCode === 229) return
        const modifier = event.metaKey || event.ctrlKey
        if (modifier || (submitOnEnter && !event.shiftKey && !event.altKey)) {
          event.preventDefault()
          send()
        }
      }}
      className={cn(
        'block max-h-40 min-h-0 w-full resize-none overflow-y-auto px-2 py-1.5 text-label leading-relaxed text-foreground outline-none',
        className
      )}
      {...props}
    />
  )
}

/** 입력 아래 한 줄 — 왼쪽에 첨부·도구, 오른쪽에 `ChatComposerSubmit`. */
function ChatComposerActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="chat-composer-actions"
      className={cn('flex items-center gap-1.5 pt-1.5', className)}
      {...props}
    />
  )
}

type ChatComposerSubmitProps = Omit<React.ComponentProps<typeof Button>, 'type'>

/** 보내기(↑). `pending` + `onStop` 이면 중단(■) 버튼이 된다. */
function ChatComposerSubmit({ className, children, ...props }: ChatComposerSubmitProps) {
  const { canSend, pending, onStop, labels } = useChatComposer('ChatComposerSubmit')
  if (pending && onStop) {
    return (
      <Button
        type="button"
        size="icon"
        aria-label={labels.stop}
        onClick={onStop}
        className={cn(
          'ml-auto bg-foreground text-background hover:bg-foreground hover:opacity-90',
          className
        )}
        {...props}
      >
        <Square className="size-3.5" fill="currentColor" aria-hidden="true" />
      </Button>
    )
  }
  return (
    <Button
      type="submit"
      size="icon"
      aria-label={labels.send}
      disabled={!canSend}
      className={cn('ml-auto', className)}
      {...props}
    >
      {children ?? <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden="true" />}
    </Button>
  )
}

export {
  Chat,
  ChatHeader,
  ChatTitle,
  ChatDescription,
  ChatHeaderActions,
  ChatMessages,
  ChatScrollToBottom,
  ChatMessage,
  ChatBubble,
  ChatMessageMeta,
  ChatTyping,
  ChatDivider,
  ChatComposer,
  ChatComposerInput,
  ChatComposerActions,
  ChatComposerSubmit,
}
export type {
  ChatProps,
  ChatMessagesProps,
  ChatMessageProps,
  ChatBubbleProps,
  ChatBubbleTone,
  ChatComposerProps,
}
