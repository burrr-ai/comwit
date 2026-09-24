export const specs = [
  {
    title: 'DragScroller',
    slug: 'drag-scroller',
    covers: ['drag-scroller'],
    imports: [
      {
        from: '@comwit/ui-templates/drag-scroller',
        names: ['DragScroller', 'type DragScrollerHandle'],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { ChevronLeft, ChevronRight } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Rail',
        gallery: true,
        description: 'Drag, flick, wheel or arrow keys — taps still click',
        render: `<DragScroller className="w-full" trackClassName="gap-3 px-1 py-2">
  {['Seoul', 'Busan', 'Jeju', 'Gangneung', 'Jeonju', 'Gyeongju', 'Sokcho', 'Yeosu', 'Andong', 'Tongyeong', 'Suwon', 'Incheon'].map((city, i) => (
    <a
      key={city}
      href="#"
      onClick={(e) => e.preventDefault()}
      className="flex h-32 w-28 shrink-0 flex-col justify-end rounded-card bg-muted p-3 text-label font-semibold text-foreground shadow-card"
      style={{ backgroundImage: \`linear-gradient(160deg, hsl(\${(i * 47) % 360} 90% 86%), hsl(\${(i * 47 + 40) % 360} 80% 70%))\` }}
    >
      {city}
    </a>
  ))}
</DragScroller>`,
      },
      {
        name: 'WithButtons',
        description: 'scrollByAmount via ref for arrow affordances',
        renderFn: `const ref = React.useRef<DragScrollerHandle>(null)
return (
  <div className="flex w-full max-w-md items-center gap-2">
    <Button variant="outline" size="icon" aria-label="Scroll left" onClick={() => ref.current?.scrollByAmount(-240)}>
      <ChevronLeft />
    </Button>
    <DragScroller ref={ref} className="flex-1" trackClassName="gap-2 py-1">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="inline-flex h-9 shrink-0 items-center rounded-pill bg-secondary px-4 text-label font-semibold">
          Tag {i + 1}
        </span>
      ))}
    </DragScroller>
    <Button variant="outline" size="icon" aria-label="Scroll right" onClick={() => ref.current?.scrollByAmount(240)}>
      <ChevronRight />
    </Button>
  </div>
)`,
      },
    ],
  },
]
