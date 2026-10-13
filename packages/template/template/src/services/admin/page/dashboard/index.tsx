'use client'

import { useMemo, useState } from 'react'
import { UsersIcon, UserCheckIcon, UserMinusIcon } from '@comwit/ui/icons'

import { Chip } from '@/lib/components/ui/chip'
import {
  DataTable,
  type ColumnDef,
  type QueryData,
  type Pageable,
} from '@/lib/components/ui/data-table'
import { AdminPage, AdminPageHeader, AdminStatCard } from '@/services/admin/_components'

// TODO: Replace with actual data types.
type Member = {
  id: string
  name: string
  email: string
  role: string
  status: '활성' | '비활성'
  createdAt: string
}

// Render column cells with UI components; use Chip tone for status colors.
const columns: ColumnDef<Member>[] = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'email', header: '이메일' },
  {
    accessorKey: 'role',
    header: '역할',
    cell: ({ row }) => (
      <Chip size="sm" variant="soft" tone="info">
        {row.getValue('role')}
      </Chip>
    ),
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => {
      const status = row.getValue('status') as Member['status']
      return (
        <Chip size="sm" variant="soft" tone={status === '활성' ? 'success' : 'neutral'}>
          {status}
        </Chip>
      )
    },
  },
  { accessorKey: 'createdAt', header: '가입일' },
]

const PAGE_SIZE = 5
const allMockMembers: Member[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `사용자 ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['관리자', '일반', '게스트'][i % 3],
  status: i % 2 === 0 ? '활성' : '비활성',
  createdAt: `2026-0${(i % 4) + 1}-${String((i + 1) * 2).padStart(2, '0')}`,
}))

// TODO: Replace with API aggregates in state; never aggregate only the current client page.
const STATS = { total: 12, active: 6, inactive: 6 }

export default function AdminDashboard() {
  // TODO: mock → useAdminUser((s) => ({ members: s.members, actions: s.actions }))
  //   data={members}, onPageChange={(page) => actions.loadMembers(page)}
  const [page, setPage] = useState(1)
  const pageable: Pageable<Member> = useMemo(
    () => ({
      items: allMockMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: allMockMembers.length,
      page,
      limit: PAGE_SIZE,
      totalPages: Math.ceil(allMockMembers.length / PAGE_SIZE),
    }),
    [page],
  )

  // Mock QueryData; pass the actual comwit query result in the integrated implementation.
  const data: QueryData<Member> = {
    data: pageable,
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    isError: false,
    error: null,
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="사용자 관리"
        description="전체 사용자 목록을 조회하고 관리합니다."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard label="전체 사용자" value={STATS.total} icon={UsersIcon} />
        <AdminStatCard label="활성" value={STATS.active} icon={UserCheckIcon} />
        <AdminStatCard label="비활성" value={STATS.inactive} icon={UserMinusIcon} />
      </div>

      <DataTable
        columns={columns}
        data={data}
        onPageChange={setPage}
        onRowClick={(member) => console.log('clicked', member)}
      />
    </AdminPage>
  )
}
