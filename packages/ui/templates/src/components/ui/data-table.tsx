'use client'

/**
 * 서버사이드 페이지네이션 DataTable
 *
 * 쿼리 결과를 data에 그대로 넘기고, onPageChange에 load action을 연결한다.
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={columns}
 *   data={products}
 *   onPageChange={(page) => actions.loadProducts(page)}
 *   onRowClick={(item) => router.push(`/products/${item.id}`)}
 *   toolbar={<div>필터, 검색, 버튼 등 자유 배치</div>}
 * />
 * ```
 */

import * as React from 'react'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Button } from './button'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

/** 페이지네이션 응답 shape */
interface Pageable<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** 쿼리 결과의 shape */
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
  /** 쿼리 결과를 그대로 넘긴다 */
  data: QueryData<TData>
  /** 페이지 변경 시 호출 — state action의 load 함수 연결 */
  onPageChange: (page: number) => void
  /** 행 클릭 시 호출 — 해당 행의 데이터를 넘긴다 */
  onRowClick?: (item: TData) => void
  /** 빈 데이터 메시지 */
  emptyMessage?: string
  /** 테이블 상단 영역 — 필터, 검색, 버튼 등 자유 배치 */
  toolbar?: React.ReactNode
  /** 표시 문구 — 기본은 영어. 로케일에 맞춰 덮는다. */
  labels?: {
    refreshing?: string
    /** 하단 범위 요약 — 기본 "1–10 of 128" */
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
  const { data: pageable, isLoading, isFetching, isSuccess, isError } = queryData
  const { items, total, totalPages, limit } = pageable
  const [page, setPage] = React.useState(pageable.page)

  // 외부(서버)에서 페이지가 바뀌면(필터/검색으로 1페이지 리셋 등) 내부 page를 동기화.
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

  // 로딩·부분 페이지에서도 테이블 높이를 한 페이지(limit행) 기준으로 고정한다.
  const rows = table.getRowModel().rows
  const rowsToFill = limit > 0 ? limit : 10
  // 첫 fetch 완료 전(isSuccess=false)에도 스켈레톤 — lazy 쿼리 빈상태 깜빡임 방지.
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
      {/* 툴바 — 필터, 검색, 버튼 등 자유 배치 */}
      {toolbar && <div className="border-b border-border px-4 py-3">{toolbar}</div>}

      {/* 테이블 */}
      <div className="relative">
        {/* 백그라운드 재조회 — 전체 딤 대신 우상단 스피너만. 첫 로딩 스켈레톤 중엔 숨김. */}
        {isFetching && !showSkeleton && (
          <div className="pointer-events-none absolute right-3 top-2.5 z-sticky inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-glass px-2.5 py-1 text-caption font-medium text-primary shadow-card backdrop-blur">
            <Loader2 className="size-3.5 animate-spin" />
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
              // 첫 로딩 — limit행만큼 스켈레톤으로 영역을 미리 잡는다.
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
                {/* 부분 페이지 — 빈 행으로 패딩해 높이를 한 페이지 기준으로 유지 */}
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

      {/* 페이지네이션 */}
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
            <ChevronLeft className="size-4" />
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
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { DataTable }
// ColumnDef 재수출 — 소비자가 @tanstack/react-table 을 직접 import 하지 않아도 컬럼을 타입한다.
export type { ColumnDef }
export type { DataTableProps, QueryData, Pageable }
