'use client'

/**
 * DataTable with server-side pagination.
 *
 * Pass query results directly to data and connect onPageChange to the load action.
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={columns}
 *   data={products}
 *   onPageChange={(page) => actions.loadProducts(page)}
 *   onRowClick={(item) => router.push(`/products/${item.id}`)}
 *   toolbar={<div>Arrange filters, search, and buttons freely</div>}
 * />
 * ```
 */

import * as React from 'react'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from '@comwit/ui/icons'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Button } from './button'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

/** Pagination response shape. */
interface Pageable<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Query result shape. */
interface QueryData<T> {
  data: Pageable<T>
  isLoading: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  /** Pass query results directly. */
  data: QueryData<TData>
  /** Called when the page changes; connect the state action's load function. */
  onPageChange: (page: number) => void
  /** Called on row click with that row's data. */
  onRowClick?: (item: TData) => void
  /** Empty-data message. */
  emptyMessage?: string
  /** Area above the table for filters, search, buttons, or other content. */
  toolbar?: React.ReactNode
  /** Display labels, defaulting to English. Override for the locale. */
  labels?: {
    refreshing?: string
    /** Bottom range summary, defaulting to "1–10 of 128". */
    range?: (start: number, end: number, total: number) => string
    previous?: string
    next?: string
  }
}

function DataTable<TData, TValue>({
  columns,
  data: queryData,
  onPageChange,
  onRowClick,
  emptyMessage = uiText.dataTable.empty,
  toolbar,
  labels,
}: DataTableProps<TData, TValue>) {
  // TanStack Table v8's internal mutable state is incompatible with automatic memoization.
  // Remove this directive after migrating to a compiler-compatible API.
  'use no memo'

  const { data: pageable, isLoading, isFetching, isSuccess, isError } = queryData
  const { items, total, totalPages, limit } = pageable
  const [page, setPage] = React.useState(pageable.page)

  // Synchronize the internal page when the server changes it, such as resetting to page 1 after filtering/searching.
  React.useEffect(() => {
    setPage(pageable.page)
  }, [pageable.page])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    state: {
      pagination: { pageIndex: 0, pageSize: limit },
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  const canPrev = page > 1
  const canNext = page < totalPages
  const rangeStart = total > 0 ? (page - 1) * limit + 1 : 0
  const rangeEnd = Math.min(page * limit, total)

  // Keep the table one full page (limit rows) tall during loading and on partial pages.
  const rows = table.getRowModel().rows
  const rowsToFill = limit > 0 ? limit : 10
  // Show skeletons before the first successful fetch too, preventing an empty-state flash for lazy queries.
  const showSkeleton = isLoading || (!isSuccess && !isError)

  const text = {
    refreshing: uiText.dataTable.refreshing,
    range: uiText.dataTable.range,
    previous: uiText.dataTable.previous,
    next: uiText.dataTable.next,
    ...labels,
  }

  const goToPage = (next: number) => {
    setPage(next)
    onPageChange(next)
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
      {/* Toolbar: freely arrange filters, search, buttons, and other content. */}
      {toolbar && <div className="border-b border-border px-4 py-3">{toolbar}</div>}

      {/* Table. */}
      <div className="relative">
        {/* Background refetch: show only a top-right spinner instead of dimming everything. Hide it during initial skeleton loading. */}
        {isFetching && !showSkeleton && (
          <div className="pointer-events-none absolute right-3 top-2.5 z-sticky inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-glass px-2.5 py-1 text-caption font-medium text-primary shadow-card backdrop-blur">
            <Loader2Icon className="size-3.5 animate-spin" />
            {text.refreshing}
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              // Initial loading: reserve one page of space with limit skeleton rows.
              Array.from({ length: rowsToFill }).map((_, ri) => (
                <TableRow key={`sk-${ri}`} className="pointer-events-none">
                  {columns.map((_, ci) => (
                    <TableCell key={ci}>
                      <div
                        className={cn(
                          'h-4 animate-pulse rounded-xs bg-skeleton',
                          ci === 0 ? 'w-28' : 'w-20'
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              <>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={onRowClick ? 'cursor-pointer active:bg-secondary' : ''}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {/* Partial page: pad with empty rows to preserve the height of one full page. */}
                {rows.length < rowsToFill &&
                  Array.from({ length: rowsToFill - rows.length }).map((_, ri) => (
                    <TableRow key={`pad-${ri}`} aria-hidden className="pointer-events-none">
                      <TableCell colSpan={columns.length}>
                        <div className="h-4" />
                      </TableCell>
                    </TableRow>
                  ))}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination. */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-caption tabular-nums text-muted-foreground">
          {text.range(rangeStart, rangeEnd, total)}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={text.previous}
            onClick={() => goToPage(page - 1)}
            disabled={!canPrev}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="min-w-[3.5rem] text-center text-caption tabular-nums text-muted-foreground">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={text.next}
            onClick={() => goToPage(page + 1)}
            disabled={!canNext}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { DataTable }
// Re-export ColumnDef so consumers can type columns without importing @tanstack/react-table directly.
export type { ColumnDef }
export type { DataTableProps, QueryData, Pageable }
