import type { Query } from '@comwit/state'
import type { Report } from '@/api/report'

export type ReportState = {
  /** Rendered with `.suspend(id)` inside a streamed Suspense boundary. */
  detail: Query<Report | null, string>
}

export type ReportActions = {
  /** Refetch the active report in the browser; `runtime` becomes 'browser'. */
  refresh(): Promise<void>
}
