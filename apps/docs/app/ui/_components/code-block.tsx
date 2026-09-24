import { CopyButton } from './copy-button'

export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 pr-12">
        <code className="font-mono text-[13px] leading-relaxed text-foreground">{code}</code>
      </pre>
      <div className="absolute right-2 top-2">
        <CopyButton text={code} />
      </div>
    </div>
  )
}
