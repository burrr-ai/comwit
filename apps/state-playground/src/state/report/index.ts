import { create } from '@comwit/state'
import { reportActions } from './actions'
import { reportModel } from './model'
import type { ReportActions, ReportState } from './types'

export const useReport = create<ReportState, ReportActions>(reportModel, {
  actions: [reportActions],
})

export type { ReportActions, ReportState } from './types'
