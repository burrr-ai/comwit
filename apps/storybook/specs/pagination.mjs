export const specs = [
  {
    title: 'Pagination',
    slug: 'pagination',
    covers: ['pagination'],
    imports: [
      {
        from: '@comwit/ui-templates/pagination',
        names: [
          'Pagination',
          'PaginationContent',
          'PaginationItem',
          'PaginationLink',
          'PaginationPrevious',
          'PaginationNext',
          'PaginationEllipsis',
        ],
      },
    ],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Interactive',
        gallery: true,
        description:
          'Composable links you lay out yourself. Here the current page is kept in React.useState.',
        renderFn: `const total = 10
const [page, setPage] = React.useState(4)
const around = [page - 1, page, page + 1].filter((n) => n > 1 && n < total)
const go = (next: number) => (event: React.MouseEvent) => {
  event.preventDefault()
  setPage(Math.min(total, Math.max(1, next)))
}
return (
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious
          href="#"
          onClick={go(page - 1)}
          disabled={page === 1}
        />
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#" isActive={page === 1} onClick={go(1)}>1</PaginationLink>
      </PaginationItem>
      {around[0] > 2 && (
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
      )}
      {around.map((n) => (
        <PaginationItem key={n}>
          <PaginationLink href="#" isActive={n === page} onClick={go(n)}>{n}</PaginationLink>
        </PaginationItem>
      ))}
      {around[around.length - 1] < total - 1 && (
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
      )}
      <PaginationItem>
        <PaginationLink href="#" isActive={page === total} onClick={go(total)}>{total}</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationNext
          href="#"
          onClick={go(page + 1)}
          disabled={page === total}
        />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
)`,
      },
      {
        name: 'Links',
        description:
          'Static markup for server-rendered lists: point each href at its page. isActive marks the current one.',
        render: `<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
      },
      {
        name: 'PreviousNext',
        description:
          'Only previous and next, with the position in between. Good for feeds and mobile.',
        renderFn: `const total = 12
const [page, setPage] = React.useState(3)
return (
  <Pagination>
    <PaginationContent className="gap-3">
      <PaginationItem>
        <PaginationPrevious
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setPage((p) => Math.max(1, p - 1))
          }}
        />
      </PaginationItem>
      <PaginationItem className="text-body-sm tabular-nums text-soft-foreground">
        Page {page} of {total}
      </PaginationItem>
      <PaginationItem>
        <PaginationNext
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setPage((p) => Math.min(total, p + 1))
          }}
        />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
)`,
      },
    ],
  },
]
