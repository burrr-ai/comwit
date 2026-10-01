'use client'

import { useMemo, useState } from 'react'
import { Users, UserCheck, UserMinus } from 'lucide-react'

import { Chip } from '@/lib/components/ui/chip'
import {
  DataTable,
  type ColumnDef,
  type QueryData,
  type Pageable,
} from '@/lib/components/ui/data-table'
import { AdminPage, AdminPageHeader, AdminStatCard } from '@/services/admin/_components'

// TODO: 실제 데이터 타입으로 교체
type Member = {
  id: string
  name: string
  email: string
  role: string
  status: '활성' | '비활성'
  createdAt: string
}

// 컬럼 셀은 ui 컴포넌트로 — 상태색은 Chip tone 으로만.
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

// TODO: 실제로는 API 집계값(state)으로 교체 — 클라에서 현재 페이지로 집계하지 말 것.
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

  // mock QueryData — 실제로는 comwit query 결과를 그대로 넘긴다
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
        <AdminStatCard label="전체 사용자" value={STATS.total} icon={Users} />
        <AdminStatCard label="활성" value={STATS.active} icon={UserCheck} />
        <AdminStatCard label="비활성" value={STATS.inactive} icon={UserMinus} />
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
