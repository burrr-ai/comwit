export const specs = [
  {
    title: 'Chat',
    slug: 'chat',
    covers: ['chat'],
    component: 'Chat',
    imports: [
      {
        from: '@comwit/ui-templates/chat',
        names: [
          'Chat',
          'ChatHeader',
          'ChatTitle',
          'ChatDescription',
          'ChatHeaderActions',
          'ChatMessages',
          'ChatMessage',
          'ChatBubble',
          'ChatMessageMeta',
          'ChatTyping',
          'ChatDivider',
          'ChatComposer',
          'ChatComposerInput',
          'ChatComposerActions',
          'ChatComposerSubmit',
        ],
      },
      { from: '@comwit/ui-templates/avatar', names: ['Avatar', 'AvatarFallback'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { Paperclip, Phone, Sparkles } from 'lucide-react'`,
      `type Turn = { id: number; role: 'user' | 'assistant'; text: string }`,
      `type Note = { id: number; from: 'me' | 'ava' | 'system'; text: string; time?: string }`,
      `const ANSWER =
  'Day one is the east: land, pick up the car and drive to Seongsan for the sunrise peak the next morning, so stay nearby. Day two is Hallasan by the Yeongsil trail, which is the shorter route with the better views, and grilled black pork in the evening. Day three is the west coast: the Suwolbong cliffs, a slow lunch of abalone porridge in Hallim, and the flight home from Jeju City.'`,
      `const THREAD: Note[] = [
  { id: 1, from: 'system', text: 'Yesterday' },
  { id: 2, from: 'ava', text: 'Are we still on for the coast road on Saturday?', time: '6:10 PM' },
  { id: 3, from: 'me', text: 'Yes! I booked the car for 9.', time: '6:12 PM' },
  { id: 4, from: 'ava', text: 'Perfect. I found a noodle place near the harbor that opens at eleven.', time: '6:12 PM' },
  { id: 5, from: 'me', text: 'Send me the pin?', time: '6:14 PM' },
  { id: 6, from: 'ava', text: 'Sent. It is the one with the blue roof.', time: '6:15 PM' },
  { id: 7, from: 'system', text: 'Today' },
  { id: 8, from: 'ava', text: 'Morning! Weather looks clear until the afternoon.', time: '8:02 AM' },
  { id: 9, from: 'me', text: 'Great, I will bring the good camera.', time: '8:05 AM' },
  { id: 10, from: 'ava', text: 'And one book too many, knowing you.', time: '8:05 AM' },
  { id: 11, from: 'me', text: 'Two, actually.', time: '8:06 AM' },
]`,
      `const REPLIES = [
  'Ha. See you at nine then.',
  'I will grab coffee for both of us on the way.',
  'Sunrise peak first, then the harbor?',
  'Sounds good to me.',
]`,
      `const now = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })`,
    ],
    stories: [
      {
        name: 'Assistant',
        gallery: true,
        description:
          'mode="assistant": your message rises to the top and the answer streams in below it. The list only follows while you are at the bottom. Send stops mid-stream.',
        renderFn: `const [turns, setTurns] = React.useState<Turn[]>([
  { id: 1, role: 'user', text: 'Plan three days in Jeju for two people who like hiking and seafood.' },
  { id: 2, role: 'assistant', text: ANSWER },
])
const [pending, setPending] = React.useState(false)
const timer = React.useRef(0)
const stop = () => {
  window.clearInterval(timer.current)
  setPending(false)
}
const send = (text: string) => {
  const id = Date.now()
  setTurns((t) => [...t, { id, role: 'user', text }])
  setPending(true)
  const words = ANSWER.split(' ')
  let count = 0
  window.setTimeout(() => {
    setTurns((t) => [...t, { id: id + 1, role: 'assistant', text: '' }])
    timer.current = window.setInterval(() => {
      count += 1
      setTurns((t) =>
        t.map((m) => (m.id === id + 1 ? { ...m, text: words.slice(0, count).join(' ') } : m))
      )
      if (count >= words.length) stop()
    }, 45)
  }, 700)
}
React.useEffect(() => () => window.clearInterval(timer.current), [])
const waiting = pending && turns[turns.length - 1]?.role === 'user'
return (
  <div className="h-[520px] w-full max-w-md overflow-hidden rounded-card border border-border bg-background shadow-card">
    <Chat mode="assistant">
      <ChatHeader>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-surface text-primary-ink">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <ChatTitle>Trip planner</ChatTitle>
          <ChatDescription>Answers stream in below your message</ChatDescription>
        </div>
      </ChatHeader>
      <ChatMessages
        items={turns}
        footer={
          waiting ? (
            <ChatMessage>
              <ChatTyping />
            </ChatMessage>
          ) : null
        }
      >
        {(turn) => (
          <ChatMessage align={turn.role === 'user' ? 'end' : 'start'}>
            <ChatBubble>{turn.text}</ChatBubble>
          </ChatMessage>
        )}
      </ChatMessages>
      <ChatComposer placeholder="Ask anything" onSend={send} pending={pending} onStop={stop} />
    </Chat>
  </div>
)`,
      },
      {
        name: 'Messenger',
        description:
          'mode="messenger": your messages always land at the bottom; theirs follow only while you are there. Scroll up and press "Receive" to see the new-messages pill.',
        renderFn: `const [messages, setMessages] = React.useState<Note[]>(THREAD)
const [typing, setTyping] = React.useState(false)
const next = React.useRef(0)
const receive = () => {
  setTyping(true)
  window.setTimeout(() => {
    setTyping(false)
    setMessages((m) => [
      ...m,
      { id: Date.now(), from: 'ava', text: REPLIES[next.current++ % REPLIES.length], time: now() },
    ])
  }, 1200)
}
const send = (text: string) => {
  setMessages((m) => [...m, { id: Date.now(), from: 'me', text, time: now() }])
  receive()
}
const ava = (
  <Avatar className="size-7">
    <AvatarFallback>AC</AvatarFallback>
  </Avatar>
)
return (
  <div className="flex w-full max-w-md flex-col items-center gap-3">
    <div className="h-[520px] w-full overflow-hidden rounded-card border border-border bg-background shadow-card">
      <Chat mode="messenger">
        <ChatHeader>
          <Avatar>
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <ChatTitle>Ava Chen</ChatTitle>
            <ChatDescription>Active now</ChatDescription>
          </div>
          <ChatHeaderActions>
            <Button variant="ghost" size="icon" aria-label="Call">
              <Phone />
            </Button>
          </ChatHeaderActions>
        </ChatHeader>
        <ChatMessages
          items={messages}
          isOwn={(m) => m.from === 'me'}
          footer={
            typing ? (
              <ChatMessage avatar={ava}>
                <ChatTyping />
              </ChatMessage>
            ) : null
          }
        >
          {(m) =>
            m.from === 'system' ? (
              <ChatDivider>{m.text}</ChatDivider>
            ) : (
              <ChatMessage
                align={m.from === 'me' ? 'end' : 'start'}
                avatar={m.from === 'ava' ? ava : undefined}
              >
                <ChatBubble>{m.text}</ChatBubble>
                <ChatMessageMeta>{m.time}</ChatMessageMeta>
              </ChatMessage>
            )
          }
        </ChatMessages>
        <ChatComposer placeholder="Message Ava" onSend={send} />
      </Chat>
    </div>
    <Button variant="outline" size="sm" onClick={receive} disabled={typing}>
      Receive a message
    </Button>
  </div>
)`,
      },
      {
        name: 'Composer',
        description:
          'Compose the input yourself: ChatComposerInput grows with the text, Enter sends and Shift+Enter breaks a line, and ChatComposerActions holds your own buttons next to ChatComposerSubmit.',
        renderFn: `const [sent, setSent] = React.useState<string | null>(null)
return (
  <div className="w-full max-w-md">
    <ChatComposer placeholder="Write a message" onSend={setSent}>
      <ChatComposerInput />
      <ChatComposerActions>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Attach a file"
          className="text-muted-foreground"
        >
          <Paperclip />
        </Button>
        <ChatComposerSubmit />
      </ChatComposerActions>
    </ChatComposer>
    <p className="px-4 text-caption text-muted-foreground" aria-live="polite">
      {sent ? 'Sent: ' + sent : 'Nothing sent yet.'}
    </p>
  </div>
)`,
      },
    ],
  },
]
