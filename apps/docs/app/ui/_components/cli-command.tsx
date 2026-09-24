import { CopyButton } from './copy-button'

export function CliCommand({ command }: { command: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-foreground px-4 py-2.5 font-mono text-body-sm text-background">
      <span className="truncate">
        <span className="select-none opacity-40">$ </span>
        {command}
      </span>
      <CopyButton
        text={command}
        className="shrink-0 text-background/60 hover:bg-background/10 hover:text-background"
      />
    </div>
  )
}
