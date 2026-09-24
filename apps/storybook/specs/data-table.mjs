export const specs = [
  {
    slug: 'data-table',
    title: 'DataTable',
    imports: [{ from: '@comwit/ui-templates/data-table', names: ['DataTable'] }],
    extraImports: ["import * as React from 'react'"],
    stories: [
      {
        name: 'Pagination',
        description: '페이지 이동을 직접 조작해 보세요.',
        renderFn: `
    const [page, setPage] = React.useState(1)
    const rows = [{ name: 'Studio', status: 'Active' }, { name: 'Library', status: 'Active' }, { name: 'Playground', status: 'Draft' }, { name: 'Portfolio', status: 'Draft' }]
    return <div className="w-full"><DataTable columns={[{ accessorKey: 'name', header: 'Project' }, { accessorKey: 'status', header: 'Status' }]} data={{ data: { items: rows.slice((page - 1) * 2, page * 2), page, limit: 2, total: rows.length, totalPages: 2 }, isLoading: false, isFetching: false, isSuccess: true, isError: false, error: null }} onPageChange={setPage} /></div>
  `,
      },
    ],
  },
]
