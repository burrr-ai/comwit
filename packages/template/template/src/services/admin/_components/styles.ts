/**
 * 어드민 표면 클래스 — 어드민 카드·섹션의 단일 스타일 출처.
 *
 * 색·반경·그림자는 comwit-tokens.css 의 토큰 유틸(bg-card · border-border · rounded-card · shadow-card)로만
 * 표현한다. 입력·버튼·배지 같은 컨트롤은 여기서 스타일하지 않는다 — `@/lib/components/ui` 를 그대로 쓴다.
 */

/** 기본 카드/섹션 표면 — 카드 면 + 헤어라인 보더 + 카드 반경. */
export const adminCard = 'rounded-card border border-border bg-card'

/** 부드러운 그림자(elevation) — 보더만으로 분리하지 않고 살짝 띄운다. */
export const adminElevation = 'shadow-card'

/** 떠 보이는 기본 카드 — adminCard + soft shadow. 리스트/섹션/통계 카드 표준. */
export const adminCardRaised = `${adminCard} shadow-card`

/** 작은 카드(통계칩·서브카드) — 한 단계 작은 반경 + soft shadow. */
export const adminCardSm = 'rounded-xl border border-border bg-card shadow-card'

/** 살짝 들어간 보조 표면 — 세그먼트 트랙·빈 상태·코드 블록 등. */
export const adminInset = 'bg-secondary'
