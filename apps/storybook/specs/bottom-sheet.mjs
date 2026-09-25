export const specs = [
  {
    title: 'BottomSheet',
    slug: 'bottom-sheet',
    covers: ['bottom-sheet'],
    imports: [
      {
        from: '@comwit/ui-templates/bottom-sheet',
        names: [
          'BottomSheet',
          'BottomSheetTrigger',
          'BottomSheetContent',
          'BottomSheetHeader',
          'BottomSheetFooter',
          'BottomSheetTitle',
          'BottomSheetDescription',
          'BottomSheetClose',
        ],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
      { from: '@comwit/ui-templates/chip', names: ['Chip'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { Bookmark, Check, MapPin, Share2, SlidersHorizontal } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description:
          'Rises from the bottom. Drag the handle down (or tap it) to dismiss; the scrim fades as you pull. Escape and the scrim still close it.',
        renderFn: `const [picked, setPicked] = React.useState(['Beach'])
const toggle = (c: string) =>
  setPicked((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]))
return (
  <BottomSheet>
    <BottomSheetTrigger asChild>
      <Button variant="outline">
        <SlidersHorizontal />
        Filters
      </Button>
    </BottomSheetTrigger>
    <BottomSheetContent>
      <BottomSheetHeader>
        <BottomSheetTitle>Filters</BottomSheetTitle>
        <BottomSheetDescription>Drag the handle down to dismiss.</BottomSheetDescription>
      </BottomSheetHeader>
      <div className="flex flex-wrap gap-2 px-5 pb-2">
        {['Beach', 'Forest', 'Market', 'Peak', 'Museum'].map((c) => (
          <Chip key={c} selected={picked.includes(c)} onClick={() => toggle(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <BottomSheetFooter>
        <BottomSheetClose asChild>
          <Button>Show {picked.length ? picked.length * 4 : 12} places</Button>
        </BottomSheetClose>
      </BottomSheetFooter>
    </BottomSheetContent>
  </BottomSheet>
)`,
      },
      {
        name: 'ScrollableBody',
        description:
          'Give the middle region min-h-0 flex-1 overflow-y-auto. It scrolls like any list; only when it is at the top does dragging down move the sheet.',
        renderFn: `const [sort, setSort] = React.useState('Closest first')
const options = [
  'Closest first', 'Top rated', 'Newest', 'Price: low to high', 'Price: high to low',
  'Most saved', 'Open now', 'Family friendly', 'Pet friendly', 'Wheelchair access',
  'Free entry', 'Guided tours', 'Sunrise spots', 'Sunset spots', 'Rainy day picks',
]
return (
  <BottomSheet>
    <BottomSheetTrigger asChild>
      <Button variant="outline">Sort by · {sort}</Button>
    </BottomSheetTrigger>
    <BottomSheetContent>
      <BottomSheetHeader>
        <BottomSheetTitle>Sort by</BottomSheetTitle>
        <BottomSheetDescription>Scroll the list. Pull down from its top to close.</BottomSheetDescription>
      </BottomSheetHeader>
      <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {options.map((o) => (
          <li key={o}>
            <BottomSheetClose asChild>
              <button
                type="button"
                onClick={() => setSort(o)}
                className="flex w-full items-center justify-between rounded-control px-2 py-3 text-left text-label text-foreground hover:bg-accent"
              >
                {o}
                {o === sort ? <Check className="size-4 text-primary" /> : null}
              </button>
            </BottomSheetClose>
          </li>
        ))}
      </ul>
    </BottomSheetContent>
  </BottomSheet>
)`,
      },
      {
        name: 'Actions',
        description:
          'A short sheet of actions, the phone-friendly menu. Each button closes the sheet.',
        render: `<BottomSheet>
  <BottomSheetTrigger asChild>
    <Button variant="outline">
      <Share2 />
      Hyeopjae beach
    </Button>
  </BottomSheetTrigger>
  <BottomSheetContent>
    <BottomSheetHeader>
      <BottomSheetTitle>Hyeopjae beach</BottomSheetTitle>
      <BottomSheetDescription>Jeju · 24 min away</BottomSheetDescription>
    </BottomSheetHeader>
    <div className="grid gap-1 px-3 pb-4">
      <BottomSheetClose asChild>
        <Button variant="ghost" className="justify-start">
          <Share2 />
          Share
        </Button>
      </BottomSheetClose>
      <BottomSheetClose asChild>
        <Button variant="ghost" className="justify-start">
          <Bookmark />
          Save
        </Button>
      </BottomSheetClose>
      <BottomSheetClose asChild>
        <Button variant="ghost" className="justify-start">
          <MapPin />
          Directions
        </Button>
      </BottomSheetClose>
    </div>
  </BottomSheetContent>
</BottomSheet>`,
      },
      {
        name: 'Controlled',
        description:
          'open / onOpenChange like Dialog. drag="handle" limits the gesture to the handle; closeThreshold (fraction of the sheet height) and velocityThreshold (px/ms) tune when a release closes it.',
        renderFn: `const [open, setOpen] = React.useState(false)
return (
  <div className="flex flex-col items-center gap-3">
    <Button variant="outline" onClick={() => setOpen(true)}>
      Open (handle only)
    </Button>
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetContent drag="handle" closeThreshold={0.4} velocityThreshold={0.6}>
        <BottomSheetHeader>
          <BottomSheetTitle>Handle only</BottomSheetTitle>
          <BottomSheetDescription>
            The body ignores drags here; only the handle moves the sheet. It takes 40% of the height, or a fast flick, to close.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <BottomSheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  </div>
)`,
      },
    ],
  },
]
