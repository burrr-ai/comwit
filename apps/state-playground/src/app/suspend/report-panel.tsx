'use client'

import { useReport } from '@/state/report'

export function ReportPanel({ id }: { id: string }) {
  const { report, actions } = useReport((s) => ({
    report: s.detail.suspend(id),
    actions: s.actions,
  }))

  if (!report.data) return null

  return (
    <section
      data-testid="report"
      style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, display: 'grid', gap: 8 }}
    >
      <strong>{report.data.title}</strong>
      <span>
        queryFn ran in: <code data-testid="runtime">{report.data.runtime}</code>
      </span>
      <span>generated at: {report.data.generatedAt}</span>
      <span>isFetching: {String(report.isFetching)}</span>
      <button type="button" onClick={() => void actions.refresh()} style={{ width: 'fit-content' }}>
        Refetch in the browser
      </button>
    </section>
  )
}
