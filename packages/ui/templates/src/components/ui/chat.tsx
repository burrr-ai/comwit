'use client'

/**
 * Chat — three vertical sections: header, messages, composer. Fills its parent, which must have a height
 * such as h-dvh or flex-1 min-h-0.
 *
 * The @comwit/ui Chat primitive owns all behavior: react-virtuoso virtualization, mode-specific scroll rules,
 * unread counts, Enter/IME handling, and automatic height. This layer assembles parts and applies tokens,
 * using the primitive's data-* attributes for visuals:
 *   data-tone: primary (own message), muted (other), plain (AI response without a surface).
 *   data-align: end (right), start (left).
 *
 *   <Chat mode="messenger"> // messenger: stay at bottom; assistant: anchor own message at the top.
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
 * Colors, radii, and shadows are tokens: own bubbles use bg-primary, others bg-muted, and the composer
 * surface uses rounded-sheet + shadow-message.
 */

import * as React from 'react'
import { ArrowDownIcon, ArrowUpIcon, SquareIcon } from '@comwit/ui/icons'
import { Chat as ChatPrimitive } from '@comwit/ui'

import { Button } from './button'
import { GlassButton } from './glass'
import { Textarea } from './textarea'
import { focusWithinField } from '../../lib/interaction'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

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
  /** Button shown when away from the bottom. Defaults to "Jump to latest". */
  scrollToBottom?: string
  /** Label when unread messages accumulate. Defaults to n new messages. */
  newMessages?: (count: number) => string
}

type ChatMessagesProps<T> = React.ComponentProps<typeof ChatPrimitive.List<T>> & {
  /** className for the outer scroller wrapper; className itself styles the list. */
  wrapperClassName?: string
  /** Set false to hide the "Jump to latest" button. */
  scrollToBottomButton?: boolean
  labels?: ChatMessagesLabels
}

/** Virtualized list with a glass scroll-to-bottom button. empty content is centered. */
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
  scrollToBottom: uiText.chat.scrollToBottom,
  newMessages: uiText.chat.newMessages,
}

type ChatScrollToBottomProps = Omit<
  React.ComponentProps<typeof GlassButton>,
  'children' | 'shape'
> & { labels?: ChatMessagesLabels }

/**
 * Glass button floating above the list when away from the bottom. Becomes a pill with a count when unread
 * messages exist. ChatMessages renders it by default; set scrollToBottomButton={false} to place your own.
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
            <ArrowDownIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />
            {pill ? <span>{text.newMessages(unread)}</span> : null}
          </GlassButton>
        )
      }}
    </ChatPrimitive.ScrollToBottom>
  )
}

/* ── Message · Bubble · Meta · Typing · Divider ───────────────── */

type ChatMessageProps = React.ComponentProps<typeof ChatPrimitive.Message> & {
  /** Avatar beside the bubble, positioned left or right according to alignment. */
  avatar?: React.ReactNode
}

/** One message row: avatar plus a vertical bubble/metadata group. Plain AI responses use the full width. */
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
        // Surfaced tones use the card radius, with a slightly sharper lower corner on the sender's side to suggest a tail.
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

/** One metadata line for time/read status below the bubble, following its alignment. */
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
  /** Screen-reader label. Defaults to "Typing". */
  label?: string
}

/** Typing indicator: three alternating bouncing dots. Follows the bubble tone, without a surface in assistant mode. */
function ChatTyping({ label = uiText.chat.typing, className, ...props }: ChatTypingProps) {
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

/** Centered caption for dates or system notices. Add as a message or place in footer. */
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
  /** Omit for the default input/send-button layout. Compose manually with ChatComposerInput, ChatComposerActions, and ChatComposerSubmit. */
  children?: React.ReactNode
}

const ComposerSkinContext = React.createContext<{
  placeholder?: string
  labels: Required<ChatComposerLabels>
}>({
  placeholder: uiText.chat.placeholder,
  labels: { send: uiText.chat.send, stop: uiText.chat.stop },
})

/** Bottom composer surface: one rounded-sheet card draws the border/focus ring; the textarea inside is bare. */
function ChatComposer({
  placeholder = uiText.chat.placeholder,
  labels,
  className,
  children,
  ...props
}: ChatComposerProps) {
  const skin = React.useMemo(
    () => ({
      placeholder,
      labels: { send: uiText.chat.send, stop: uiText.chat.stop, ...labels },
    }),
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

/** Single-line textarea that grows automatically up to max-h-40. The primitive handles Enter/IME behavior. */
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

/** Row below the input: attachments/tools on the left and ChatComposerSubmit on the right. */
function ChatComposerActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="chat-composer-actions"
      className={cn('flex items-center gap-1.5 pt-1.5', className)}
      {...props}
    />
  )
}

/** Send (↑). With pending and onStop, the primitive renders a stop (■) button instead. */
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
          <SquareIcon className="size-3.5" fill="currentColor" aria-hidden="true" />
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
          {children ?? <ArrowUpIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />}
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
