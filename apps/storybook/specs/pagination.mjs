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
        name: 'Default',
        description: '이전·다음 · 페이지 번호 · 생략(...) · 현재 페이지 강조',
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
        name: 'Truncated',
        description: '양쪽 생략(...) · 가운데 페이지 그룹',
        render: `<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">6</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>7</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">8</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">20</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
      },
      {
        name: 'Interactive',
        description: 'useState로 현재 페이지 제어 · 이전/다음/번호 클릭',
        renderFn: `const pages = [1, 2, 3, 4, 5]
const [page, setPage] = React.useState(3)
return (
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setPage((p) => Math.max(1, p - 1))
          }}
        />
      </PaginationItem>
      {pages.map((n) => (
        <PaginationItem key={n}>
          <PaginationLink
            href="#"
            isActive={n === page}
            onClick={(e) => {
              e.preventDefault()
              setPage(n)
            }}
          >
            {n}
          </PaginationLink>
        </PaginationItem>
      ))}
      <PaginationItem>
        <PaginationNext
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setPage((p) => Math.min(pages.length, p + 1))
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
