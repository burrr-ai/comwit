'use client'

/**
 * Chat — 헤더 · 메시지 · 컴포저의 세로 3단. 부모를 꽉 채운다(부모에 높이가 있어야 한다: `h-dvh`, `flex-1 min-h-0`).
 *
 * 동작은 전부 @comwit/ui 의 Chat 프리미티브가 갖는다 — 가상화(react-virtuoso)·모드별 스크롤 규칙·안 읽음 카운트·
 * Enter/IME·자동 높이. 여기서는 파트를 조립하고 토큰만 입힌다. 프리미티브가 방출하는 data-* 로 시각을 가른다:
 *   data-tone   primary(내 메시지) · muted(상대) · plain(AI 답변, 면 없음)
 *   data-align  end(오른쪽) · start(왼쪽)
 *
 *   <Chat mode="messenger">                          // messenger: 바닥 유지 · assistant: 내 메시지 상단 고정
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
import { Chat as ChatPrimitive } from '@comwit/ui'

import { Button } from './button'
import { GlassButton } from './glass'
import { Textarea } from './textarea'
import { focusWithinField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

export type ChatMode = NonNullable<React.ComponentProps<typeof ChatPrimitive.Root>['mode']>

/* ── Root · Header ────────────────────────────────────────────── */

function Chat({ className, ...props }: React.ComponentProps<typeof ChatPrimitive.Root>) {
  return (
    <ChatPrimitive.Root
      data-slot="chat"
      className={cn(
        'relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground',
        className
      )}
      {...props}
    />
  )
}

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

function ChatTitle({ className, ...props }: React.ComponentProps<typeof ChatPrimitive.Title>) {
  return (
    <ChatPrimitive.Title
      data-slot="chat-title"
      className={cn('min-w-0 truncate text-title-md text-foreground', className)}
      {...props}
    />
  )
}

function ChatDescription({
  className,
  ...props
}: React.ComponentProps<typeof ChatPrimitive.Description>) {
  return (
    <ChatPrimitive.Description
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

/* ── Messages ─────────────────────────────────────────────────── */

type ChatMessagesLabels = {
  /** 바닥이 아닐 때 뜨는 버튼. 기본 "Jump to latest". */
  scrollToBottom?: string
  /** 안 읽은 메시지가 쌓였을 때. 기본 `n new messages`. */
  newMessages?: (count: number) => string
}

type ChatMessagesProps<T> = React.ComponentProps<typeof ChatPrimitive.List<T>> & {
  /** 스크롤러 바깥 래퍼의 className(목록 자체는 `className`). */
  wrapperClassName?: string
  /** false 면 "Jump to latest" 버튼을 그리지 않는다. */
  scrollToBottomButton?: boolean
  labels?: ChatMessagesLabels
}

/** 가상화 목록 + 바닥으로 가는 유리 버튼. `empty` 는 가운데에 놓인다. */
function ChatMessages<T>({
  className,
  wrapperClassName,
  scrollToBottomButton = true,
  labels,
  empty,
  ...props
}: ChatMessagesProps<T>) {
  return (
    <div
      data-slot="chat-messages"
      className={cn('relative min-h-0 w-full flex-1', wrapperClassName)}
    >
      <ChatPrimitive.List
        pinOffset={12}
        header={<div aria-hidden="true" className="h-3" />}
        empty={
          empty === undefined ? undefined : (
            <div className="flex h-full items-center justify-center p-6">{empty}</div>
          )
        }
        className={cn('overflow-x-hidden overscroll-y-contain', className)}
        {...props}
      />
      {scrollToBottomButton ? <ChatScrollToBottom labels={labels} /> : null}
    </div>
  )
}

const DEFAULT_LABELS: Required<ChatMessagesLabels> = {
  scrollToBottom: 'Jump to latest',
  newMessages: (n) => (n === 1 ? '1 new message' : `${n} new messages`),
}

type ChatScrollToBottomProps = Omit<
  React.ComponentProps<typeof GlassButton>,
  'children' | 'shape'
> & { labels?: ChatMessagesLabels }

/**
 * 바닥이 아닐 때 목록 위에 뜨는 유리 버튼. 안 읽은 메시지가 있으면 개수를 단 알약이 된다.
 * `ChatMessages` 가 기본으로 그린다(`scrollToBottomButton={false}` 로 끄고 직접 놓을 수 있다).
 */
function ChatScrollToBottom({ className, labels, ...props }: ChatScrollToBottomProps) {
  const text = { ...DEFAULT_LABELS, ...labels }
  return (
    <ChatPrimitive.ScrollToBottom asChild>
      {({ unread }) => {
        const pill = unread > 0
        return (
          <GlassButton
            shape={pill ? 'pill' : 'circle'}
            aria-label={pill ? undefined : text.scrollToBottom}
            data-slot="chat-scroll-to-bottom"
            className={cn(
              'absolute bottom-3 left-1/2 z-raised -translate-x-1/2 animate-in fade-in-0 slide-in-from-bottom-2 duration-base',
              pill ? 'h-9 px-3.5' : 'size-10',
              className
            )}
            contentClassName={cn('text-label font-semibold', pill && 'gap-1.5')}
            {...props}
          >
            <ArrowDown className="size-4" strokeWidth={2.5} aria-hidden="true" />
            {pill ? <span>{text.newMessages(unread)}</span> : null}
          </GlassButton>
        )
      }}
    </ChatPrimitive.ScrollToBottom>
  )
}

/* ── Message · Bubble · Meta · Typing · Divider ───────────────── */

type ChatMessageProps = React.ComponentProps<typeof ChatPrimitive.Message> & {
  /** 말풍선 옆 아바타. 정렬에 따라 왼쪽/오른쪽에 붙는다. */
  avatar?: React.ReactNode
}

/** 메시지 한 줄 — 아바타 + (말풍선 · 메타) 세로 묶음. plain 톤(AI 답변)은 전폭을 쓴다. */
function ChatMessage({ avatar, className, children, ...props }: ChatMessageProps) {
  return (
    <ChatPrimitive.Message
      data-slot="chat-message"
      className={cn(
        'flex w-full items-end gap-2 px-4 py-1 data-[align=end]:flex-row-reverse',
        className
      )}
      {...props}
    >
      {avatar ? (
        <div data-slot="chat-message-avatar" className="shrink-0 self-start">
          {avatar}
        </div>
      ) : null}
      <ChatPrimitive.MessageContent
        data-slot="chat-message-content"
        className="flex max-w-[85%] min-w-0 flex-col gap-1 data-[align=end]:items-end data-[align=start]:items-start data-[tone=plain]:max-w-full data-[tone=plain]:flex-1"
      >
        {children}
      </ChatPrimitive.MessageContent>
    </ChatPrimitive.Message>
  )
}

function ChatBubble({ className, ...props }: React.ComponentProps<typeof ChatPrimitive.Bubble>) {
  return (
    <ChatPrimitive.Bubble
      data-slot="chat-bubble"
      className={cn(
        'min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap text-label leading-relaxed',
        // 면이 있는 톤은 카드 반경에, 보낸 쪽 아래 모서리만 살짝 각져 꼬리 느낌을 낸다.
        'data-[tone=primary]:rounded-card data-[tone=primary]:bg-primary data-[tone=primary]:px-3.5 data-[tone=primary]:py-2 data-[tone=primary]:text-primary-foreground',
        'data-[tone=muted]:rounded-card data-[tone=muted]:bg-muted data-[tone=muted]:px-3.5 data-[tone=muted]:py-2 data-[tone=muted]:text-foreground',
        'data-[align=end]:rounded-br-sm data-[align=start]:rounded-bl-sm',
        'data-[tone=plain]:rounded-none data-[tone=plain]:py-1 data-[tone=plain]:text-foreground',
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

type ChatTypingProps = Omit<React.ComponentProps<typeof ChatBubble>, 'children'> & {
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

type ChatComposerProps = React.ComponentProps<typeof ChatPrimitive.Composer> & {
  placeholder?: string
  labels?: ChatComposerLabels
  /** 생략하면 기본 배치(입력 + 보내기 버튼). 직접 조립하려면 `ChatComposerInput` · `ChatComposerActions` · `ChatComposerSubmit`. */
  children?: React.ReactNode
}

const ComposerSkinContext = React.createContext<{
  placeholder?: string
  labels: Required<ChatComposerLabels>
}>({ placeholder: 'Message', labels: { send: 'Send', stop: 'Stop' } })

/** 하단 입력 면 — `rounded-sheet` 카드 하나가 보더·포커스 링을 그리고, 안의 textarea 는 bare 다. */
function ChatComposer({
  placeholder = 'Message',
  labels,
  className,
  children,
  ...props
}: ChatComposerProps) {
  const skin = React.useMemo(
    () => ({ placeholder, labels: { send: 'Send', stop: 'Stop', ...labels } }),
    [placeholder, labels]
  )
  return (
    <ComposerSkinContext.Provider value={skin}>
      <ChatPrimitive.Composer
        data-slot="chat-composer"
        className={cn(
          'group/composer shrink-0 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          className
        )}
        {...props}
      >
        <div
          data-slot="chat-composer-surface"
          className={cn(
            'rounded-sheet border border-input bg-background p-2 shadow-message transition-[border-color,box-shadow] duration-fast group-data-[disabled]/composer:bg-muted',
            focusWithinField
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
      </ChatPrimitive.Composer>
    </ComposerSkinContext.Provider>
  )
}

/** 자동으로 자라는 한 줄 textarea(최대 `max-h-40`). Enter/IME 처리는 프리미티브가 한다. */
function ChatComposerInput({ className, ...props }: React.ComponentProps<typeof Textarea>) {
  const { placeholder } = React.useContext(ComposerSkinContext)
  return (
    <ChatPrimitive.ComposerInput asChild>
      <Textarea
        bare
        data-slot="chat-composer-input"
        placeholder={placeholder}
        className={cn(
          'block max-h-40 min-h-0 w-full resize-none overflow-y-auto px-2 py-1.5 text-label leading-relaxed text-foreground outline-none',
          className
        )}
        {...props}
      />
    </ChatPrimitive.ComposerInput>
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

/** 보내기(↑). `pending` + `onStop` 이면 프리미티브가 중단(■) 버튼을 대신 렌더한다. */
function ChatComposerSubmit({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'type'>) {
  const { labels } = React.useContext(ComposerSkinContext)
  return (
    <>
      <ChatPrimitive.ComposerStop asChild>
        <Button
          size="icon"
          aria-label={labels.stop}
          data-slot="chat-composer-stop"
          className={cn(
            'ml-auto bg-foreground text-background hover:bg-foreground hover:opacity-90',
            className
          )}
          {...props}
        >
          <Square className="size-3.5" fill="currentColor" aria-hidden="true" />
        </Button>
      </ChatPrimitive.ComposerStop>
      <ChatPrimitive.ComposerSubmit asChild>
        <Button
          size="icon"
          aria-label={labels.send}
          data-slot="chat-composer-submit"
          className={cn('ml-auto', className)}
          {...props}
        >
          {children ?? <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden="true" />}
        </Button>
      </ChatPrimitive.ComposerSubmit>
    </>
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
export type { ChatMessagesProps, ChatMessageProps, ChatComposerProps }
