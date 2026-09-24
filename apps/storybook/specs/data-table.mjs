export const specs = [
  {
    slug: 'data-table',
    title: 'DataTable',
    covers: ['data-table'],
    imports: [
      { from: '@comwit/ui-templates/data-table', names: ['DataTable'] },
      { from: '@comwit/ui-templates/badge', names: ['Badge'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: ["import * as React from 'react'", "import { Download } from 'lucide-react'"],
    stories: [
      {
        name: 'Members',
        gallery: true,
        description: 'Pass the query result as data and wire onPageChange to your load action.',
        renderFn: `const members = [
  { name: 'Ava Chen', role: 'Owner' },
  { name: 'Liam Patel', role: 'Admin' },
  { name: 'Sofia Rossi', role: 'Editor' },
  { name: 'Noah Kim', role: 'Editor' },
  { name: 'Mia Johnson', role: 'Viewer' },
  { name: 'Ethan Brown', role: 'Viewer' },
]
const limit = 3
const [page, setPage] = React.useState(1)
return (
  <div className="w-full max-w-md">
    <DataTable
      columns={[
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'role', header: 'Role' },
      ]}
      data={{
        data: {
          items: members.slice((page - 1) * limit, page * limit),
          page,
          limit,
          total: members.length,
          totalPages: Math.ceil(members.length / limit),
        },
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
      }}
      onPageChange={setPage}
    />
  </div>
)`,
      },
      {
        name: 'ToolbarAndLabels',
        description:
          'toolbar adds a header slot, cell renders custom content, labels rewrites the footer copy, and isFetching shows the refresh pill.',
        renderFn: `const orders = [
  { id: '#3021', customer: 'Northwind', total: 1280, status: 'Paid' },
  { id: '#3022', customer: 'Globex', total: 640, status: 'Pending' },
  { id: '#3023', customer: 'Initech', total: 2150, status: 'Paid' },
  { id: '#3024', customer: 'Umbrella', total: 320, status: 'Refunded' },
  { id: '#3025', customer: 'Hooli', total: 990, status: 'Paid' },
  { id: '#3026', customer: 'Stark Labs', total: 4100, status: 'Pending' },
  { id: '#3027', customer: 'Wayne Co.', total: 760, status: 'Paid' },
  { id: '#3028', customer: 'Acme', total: 180, status: 'Refunded' },
]
const limit = 4
const [page, setPage] = React.useState(1)
return (
  <div className="w-full max-w-xl">
    <DataTable
      toolbar={
        <div className="flex items-center justify-between gap-4">
          <p className="text-body-sm font-semibold text-foreground">Recent orders</p>
          <Button size="sm" variant="outline">
            <Download /> Export
          </Button>
        </div>
      }
      columns={[
        { accessorKey: 'id', header: 'Order' },
        { accessorKey: 'customer', header: 'Customer' },
        {
          accessorKey: 'total',
          header: 'Total',
          cell: ({ row }) => <span className="tabular-nums">{\`$\${row.original.total.toLocaleString()}\`}</span>,
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => (
            <Badge
              variant={
                row.original.status === 'Paid'
                  ? 'success'
                  : row.original.status === 'Pending'
                    ? 'warning'
                    : 'secondary'
              }
            >
              {row.original.status}
            </Badge>
          ),
        },
      ]}
      data={{
        data: {
          items: orders.slice((page - 1) * limit, page * limit),
          page,
          limit,
          total: orders.length,
          totalPages: Math.ceil(orders.length / limit),
        },
        isLoading: false,
        isFetching: true,
        isSuccess: true,
        isError: false,
        error: null,
      }}
      onPageChange={setPage}
      labels={{
        refreshing: 'Syncing',
        range: (start, end, total) => \`Showing \${start}–\${end} of \${total} orders\`,
        previous: 'Previous',
        next: 'Next',
      }}
    />
  </div>
)`,
      },
      {
        name: 'Loading',
        description: 'While the first request is in flight, skeleton rows hold one page of height.',
        render: `<div className="w-full max-w-md">
  <DataTable
    columns={[
      { accessorKey: 'name', header: 'Project' },
      { accessorKey: 'owner', header: 'Owner' },
      { accessorKey: 'updated', header: 'Updated' },
    ]}
    data={{
      data: { items: [], page: 1, limit: 4, total: 0, totalPages: 0 },
      isLoading: true,
      isFetching: true,
      isSuccess: false,
      isError: false,
      error: null,
    }}
    onPageChange={() => {}}
  />
</div>`,
      },
      {
        name: 'Empty',
        description: 'emptyMessage replaces the rows when the query succeeds with no items.',
        render: `<div className="w-full max-w-md">
  <DataTable
    columns={[
      { accessorKey: 'number', header: 'Invoice' },
      { accessorKey: 'amount', header: 'Amount' },
      { accessorKey: 'status', header: 'Status' },
    ]}
    data={{
      data: { items: [], page: 1, limit: 4, total: 0, totalPages: 0 },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
    }}
    onPageChange={() => {}}
    emptyMessage="No invoices yet. They will appear here after your first payment."
  />
</div>`,
      },
    ],
  },
]
