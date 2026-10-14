'use client'

import * as React from 'react'
import { toast } from '@comwit/ui-templates/toast'
import { SearchIcon } from '@comwit/ui/icons'
import { DataTable, type ColumnDef, type QueryData } from '@comwit/ui-templates/data-table'
import { Chip } from '@comwit/ui-templates/chip'
import { Input } from '@comwit/ui-templates/input'
import { InputGroup, InputAddon } from '@comwit/ui-templates/input-group'

type Status = 'success' | 'warning' | 'destructive'

type Order = {
  id: string
  customer: string
  status: Status
  amount: number
}

const STATUS_LABEL: Record<Status, string> = {
  success: 'Paid',
  warning: 'Awaiting shipment',
  destructive: 'Canceled',
}

const NAMES = [
  'Alex Token',
  'Jamie Surface',
  'Sam Radius',
  'Taylor Shadow',
  'Morgan Hairline',
  'Jordan Parchment',
  'Casey Ink',
]

/* Fixed server-like dataset: 47 rows leave a partial final page to demonstrate empty-row padding. */
const ALL: Order[] = Array.from({ length: 47 }, (_, i) => ({
  id: `ORD-${String(1000 + i)}`,
  customer: NAMES[i % NAMES.length],
  status: (['success', 'warning', 'destructive'] as const)[i % 3],
  amount: (i % 9) * 12_400 + 3_900,
}))

const LIMIT = 8

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'id', header: 'Order number' },
  { accessorKey: 'customer', header: 'Customer' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const s = row.original.status
      return <Chip tone={s}>{STATUS_LABEL[s]}</Chip>
    },
  },
  {
    accessorKey: 'amount',
    header: () => <span className="block text-right">Amount</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original.amount.toLocaleString('ko-KR')} KRW
      </span>
    ),
  },
]

/** Simulate latency to show initial-loading skeletons and the refresh spinner. */
export function DataTableDemo() {
  const [query, setQuery] = React.useState<QueryData<Order>>({
    data: { items: [], total: 0, page: 1, limit: LIMIT, totalPages: 0 },
    isLoading: true,
    isFetching: true,
    isSuccess: false,
    isError: false,
    error: null,
  })

  const load = React.useCallback((page: number, firstLoad = false) => {
    setQuery((q) => ({
      ...q,
      isLoading: firstLoad,
      isFetching: true,
    }))

    const t = setTimeout(
      () => {
        const start = (page - 1) * LIMIT
        setQuery({
          data: {
            items: ALL.slice(start, start + LIMIT),
            total: ALL.length,
            page,
            limit: LIMIT,
            totalPages: Math.ceil(ALL.length / LIMIT),
          },
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          isError: false,
          error: null,
        })
      },
      firstLoad ? 900 : 550
    )

    return () => clearTimeout(t)
  }, [])

  React.useEffect(() => load(1, true), [load])

  return (
    <DataTable
      columns={columns}
      data={query}
      onPageChange={(page) => load(page)}
      onRowClick={(order) => toast(`${order.id} · ${order.customer}`)}
      toolbar={
        <div className="flex items-center justify-between gap-3">
          <InputGroup className="max-w-xs">
            <InputAddon>
              <SearchIcon />
            </InputAddon>
            <Input placeholder="Search orders" />
          </InputGroup>
          <span className="shrink-0 text-caption text-muted-foreground">
            Toolbar slot: arrange filters and search freely
          </span>
        </div>
      }
    />
  )
}
