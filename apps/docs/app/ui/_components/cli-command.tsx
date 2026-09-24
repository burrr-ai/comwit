import { cn } from '@comwit/ui-templates/lib/utils'
import { CopyButton } from './copy-button'

export function CliCommand({ command, className }: { command: string; className?: string }) {
  return (
    <div
      className={cn(
        'ui-code flex h-11 items-center justify-between gap-3 rounded-control pr-1.5 pl-4 font-mono text-body-sm',
        className
      )}
    >
      <code className="truncate">
        <span className="select-none opacity-40">$ </span>
        {command}
      </code>
      <CopyButton text={command} label="Copy command" />
    </div>
  )
}
