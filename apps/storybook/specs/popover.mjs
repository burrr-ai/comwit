export const specs = [
  {
    title: 'Popover',
    slug: 'popover',
    covers: ['popover'],
    imports: [
      {
        from: '@comwit/ui-templates/popover',
        names: ['Popover', 'PopoverTrigger', 'PopoverContent'],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { Check, Copy, Share2 } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Non-modal content on a refractive glass panel, anchored to its trigger.',
        renderFn: `const [copied, setCopied] = React.useState(false)
return (
  <Popover onOpenChange={() => setCopied(false)}>
    <PopoverTrigger asChild>
      <Button variant="outline">
        <Share2 />
        Share
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-80">
      <div className="grid gap-3">
        <div className="grid gap-1">
          <p className="text-title-sm">Share this board</p>
          <p className="text-caption text-muted-foreground">Anyone with the link can view.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input readOnly aria-label="Share link" defaultValue="https://comwit.io/b/q3-launch" />
          <Button size="icon" variant="secondary" aria-label="Copy link" onClick={() => setCopied(true)}>
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
)`,
      },
      {
        name: 'Alignments',
        description: 'align — start · center · end relative to the trigger.',
        render: `<div className="flex flex-wrap items-center gap-3">
  {(['start', 'center', 'end'] as const).map((align) => (
    <Popover key={align}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="capitalize">{align}</Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-60">
        <p className="text-caption text-muted-foreground">
          Aligned to the {align} edge of the trigger.
        </p>
      </PopoverContent>
    </Popover>
  ))}
</div>`,
      },
      {
        name: 'Sides',
        description:
          'side — top · right · bottom · left. Flips automatically when there is no room.',
        render: `<div className="flex flex-wrap items-center gap-3">
  {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
    <Popover key={side}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="capitalize">{side}</Button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-56">
        <p className="text-caption text-muted-foreground">Opens on the {side} side.</p>
      </PopoverContent>
    </Popover>
  ))}
</div>`,
      },
      {
        name: 'Controlled',
        description: 'open / onOpenChange — close the popover after applying a change.',
        renderFn: `const [open, setOpen] = React.useState(false)
const [width, setWidth] = React.useState('1280')
const [draft, setDraft] = React.useState(width)
return (
  <div className="flex flex-col items-center gap-3">
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setDraft(width)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline">Canvas size</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            setWidth(draft)
            setOpen(false)
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="popover-width">Width (px)</Label>
            <Input
              id="popover-width"
              inputMode="numeric"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </div>
          <Button type="submit" size="sm">Apply</Button>
        </form>
      </PopoverContent>
    </Popover>
    <p className="text-caption text-muted-foreground">Current width: {width}px</p>
  </div>
)`,
      },
    ],
  },
]
