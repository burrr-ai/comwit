import { action } from '@comwit/state'
import { reportModel } from './model'
import type { ReportActions } from './types'

export const reportActions = action<ReportActions>(({ state }) => {
  const report = state(reportModel)
  return {
    async refresh() {
      await report.detail.refetch()
    },
  }
})
