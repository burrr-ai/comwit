'use client'

import * as React from 'react'
import { toast } from '@comwit/ui-templates/toast'
import { Search } from 'lucide-react'
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
  success: '결제완료',
  warning: '배송대기',
  destructive: '취소',
}

const NAMES = ['김토큰', '이서피스', '박라디우스', '최섀도우', '정하이라인', '한파치먼트', '오잉크']

/* 서버를 흉내내는 고정 데이터셋 — 47건이라 마지막 페이지가 부분 페이지(빈 행 패딩 시연) */
const ALL: Order[] = Array.from({ length: 47 }, (_, i) => ({
  id: `ORD-${String(1000 + i)}`,
  customer: NAMES[i % NAMES.length],
  status: (['success', 'warning', 'destructive'] as const)[i % 3],
  amount: (i % 9) * 12_400 + 3_900,
}))

const LIMIT = 8

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'id', header: '주문번호' },
  { accessorKey: 'customer', header: '고객' },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => {
      const s = row.original.status
      return <Chip tone={s}>{STATUS_LABEL[s]}</Chip>
    },
  },
  {
    accessorKey: 'amount',
    header: () => <span className="block text-right">금액</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original.amount.toLocaleString('ko-KR')}원
      </span>
    ),
  },
]

/** 네트워크 지연을 흉내내 스켈레톤(첫 로딩)과 "갱신 중" 스피너(재조회)를 둘 다 보여준다. */
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
              <Search />
            </InputAddon>
            <Input placeholder="주문번호 검색" />
          </InputGroup>
          <span className="shrink-0 text-caption text-muted-foreground">
            toolbar 슬롯 — 필터·검색 자유 배치
          </span>
        </div>
      }
    />
  )
}
