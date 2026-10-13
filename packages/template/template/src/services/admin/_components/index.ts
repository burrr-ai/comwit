// Keep only admin compositions here: shell, page structure, stats, and charts. For controls,
// import @/lib/components/ui directly (Input, TextField, Select, Checkbox, Chip, Avatar, EmptyState, DataTable, etc.).
export { adminCard, adminCardRaised, adminCardSm, adminElevation, adminInset } from './styles'
export { AdminPage } from './admin-page'
export { AdminSection } from './admin-section'
export { AdminPageHeader } from './admin-page-header'
export {
  AdminDefinitionList,
  AdminDefRow,
  type AdminDefRowItem,
} from './admin-definition-list'
export { AdminStatCard, AdminStatChip } from './admin-stat-card'
export { AdminChartCard } from './admin-chart-card'
export {
  AdminSparkline,
  AdminLineChart,
  AdminDonut,
  AdminBarList,
  type AdminLineSeries,
  type AdminDonutSegment,
  type AdminBarItem,
} from './admin-charts'
export { AdminListRow } from './admin-list-row'
export { AdminReasonDialog } from './admin-reason-dialog'
export {
  AdminShell,
  type AdminNavItem,
  type AdminNavGroup,
} from './admin-shell'
