import type { ReactNode } from 'react'

/** 상세 셸: 앱 공통 app-shell 경계 안에서 렌더되며 BottomNav는 없다.
 * 제품별 경로 배치와 SEO 분기는 src/app/.ai.md를 따른다.
 */
export default function DetailLayout({ children }: { children: ReactNode }) {
  return children
}
