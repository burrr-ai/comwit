import { model, query } from '@comwit/state'
import { getReport } from '@/api/report'
import type { ReportState } from './types'

export const reportModel = model<ReportState>({
  detail: query({
    initialData: null,
    staleTime: 60_000,
    queryFn: (id) => getReport(id),
  }),
})
