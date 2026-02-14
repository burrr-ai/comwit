import Image from "next/image";

function CodeBlock() {
  return (
    <div className="code-block w-full px-6 py-5">
      <div className="mb-3 flex items-center gap-2 text-xs text-white/30">
        <span className="inline-block h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2">state/todo/index.ts</span>
      </div>
      <pre className="leading-relaxed">
        <code>{`\
`}<span className="keyword">import</span>{" { "}<span className="const">model</span>{", "}<span className="const">action</span>{", "}<span className="const">create</span>{" } "}<span className="keyword">from</span> <span className="string">&apos;muchajs&apos;</span>{`

`}<span className="comment">{"// define your domain state"}</span>{`
`}<span className="keyword">const</span> <span className="const">Todo</span> = <span className="func">model</span>{"({ "}<span className="param">todos</span>{": [], "}<span className="param">count</span>{": 0 })"}{`

`}<span className="comment">{"// actions mutate state directly — no reducers"}</span>{`
`}<span className="keyword">const</span> <span className="const">crud</span> = <span className="func">action</span>({"({ "}<span className="param">inject</span>{" }) => {"}{`
`}{"  "}<span className="keyword">const</span> <span className="param">m</span> = <span className="func">inject</span>(<span className="const">Todo</span>){`
`}{"  "}<span className="keyword">return</span> {"{"}{`
`}{"    "}<span className="keyword">async</span> <span className="func">create</span>(<span className="param">title</span><span className="type">: string</span>) {"{"}{`
`}{"      "}<span className="param">m</span>.todos.<span className="func">push</span>(<span className="keyword">await</span> api.<span className="func">createTodo</span>({"{ "}<span className="param">title</span>{" }"})){`
`}{"      "}<span className="param">m</span>.count++{`
`}{"    }"}{`
`}{"  }"}{`
`}{"})"}{`

`}<span className="comment">{"// one line — hook is ready"}</span>{`
`}<span className="keyword">export const</span> <span className="const">useTodo</span> = <span className="func">create</span>(<span className="const">Todo</span>{", { "}<span className="param">actions</span>{": ["}<span className="const">crud</span>{"] })"}</code>
      </pre>
    </div>
  );
}

function UsageBlock() {
  return (
    <div className="code-block w-full px-6 py-5">
      <div className="mb-3 flex items-center gap-2 text-xs text-white/30">
        <span className="inline-block h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2">app.tsx</span>
      </div>
      <pre className="leading-relaxed">
        <code>{`\
`}<span className="keyword">import</span>{" { "}<span className="const">useTodo</span>{" } "}<span className="keyword">from</span> <span className="string">&apos;@/state/todo&apos;</span>{`

`}<span className="keyword">function</span> <span className="func">TodoPage</span>() {"{"}{`
`}{"  "}<span className="keyword">const</span> {"{ "}<span className="param">todos</span>{", "}<span className="param">count</span>{", "}<span className="param">actions</span>{" }"} = <span className="func">useTodo</span>(){`

`}{"  "}<span className="keyword">return</span> {"("}{`
`}{"    <"}<span className="const">div</span>{">"}{`
`}{"      <"}<span className="const">h1</span>{">{"}<span className="param">count</span>{"} todos</"}<span className="const">h1</span>{">"}{`
`}{"      <"}<span className="const">button</span> <span className="param">onClick</span>{"={() => "}<span className="param">actions</span>.<span className="func">create</span>(<span className="string">&apos;New&apos;</span>){"}"}{">Add</"}<span className="const">button</span>{">"}{`
`}{"    </"}<span className="const">div</span>{">"}{`
`}{"  )"}{`
`}{"}"}</code>
      </pre>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-screen bg-background font-sans">
      {/* Left side — Mucha artwork */}
      <div className="relative hidden w-[42%] overflow-hidden lg:block">
        <Image
          src="/mucha-dance.jpg"
          alt="Alphonse Mucha — Dance (1898)"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background" />
        <div className="absolute inset-0 bg-background/10" />
      </div>

      {/* Right side — Content */}
      <div className="flex flex-1 flex-col items-center justify-between px-8 py-8 lg:items-start lg:px-16">
        {/* Mobile background */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <Image
            src="/mucha-dance.jpg"
            alt=""
            fill
            className="object-cover opacity-[0.08]"
          />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex w-full max-w-2xl items-center justify-between text-sm tracking-wide">
          <span className="font-serif text-lg font-semibold text-foreground">
            muchajs
          </span>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/piscesyuma/yoshi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/muchajs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 transition-colors hover:text-foreground"
            >
              npm
            </a>
          </div>
        </nav>

        {/* Main content */}
        <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 py-12">
          {/* Title */}
          <div>
            <h1 className="mb-3 font-serif text-5xl font-bold tracking-widest text-foreground sm:text-6xl">
              m u c h a
            </h1>
            <p className="text-lg tracking-wide text-foreground/60">
              LLM-friendly state management for React
            </p>
          </div>

          {/* Ornament */}
          <div className="ornament w-48">
            <span />
          </div>

          {/* Code snippets */}
          <div className="flex flex-col gap-4">
            <CodeBlock />
            <UsageBlock />
          </div>

          {/* Tagline */}
          <p className="font-serif text-sm italic tracking-wide text-gold-dark">
            &ldquo;Less tokens. Better instructions.&rdquo;
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              href="https://github.com/piscesyuma/yoshi#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-gold bg-gold px-8 py-3 text-sm font-medium tracking-wide text-cream-light transition-colors hover:border-gold-dark hover:bg-gold-dark"
            >
              Get Started
            </a>
            <div className="group flex items-center gap-2 rounded-full border-2 border-gold/40 bg-cream-light/60 px-6 py-3 font-mono text-sm tracking-wide text-foreground/70 backdrop-blur transition-colors hover:border-gold">
              npm i muchajs
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 flex w-full max-w-2xl items-center gap-6 text-xs tracking-wide text-foreground/40">
          <a
            href="https://github.com/piscesyuma/yoshi"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/70"
          >
            Source
          </a>
          <span className="text-gold/30">&#x2756;</span>
          <a
            href="/playground"
            className="transition-colors hover:text-foreground/70"
          >
            Playground
          </a>
        </footer>
      </div>
    </div>
  );
}
