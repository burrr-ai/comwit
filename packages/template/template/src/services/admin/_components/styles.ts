/**
 * Single source of admin card and section surface classes.
 * Use comwit-tokens.css utilities for colors, radii, and shadows:
 * bg-card, border-border, rounded-card, shadow-card.
 * Do not style inputs, buttons, or badges here; use @/lib/components/ui.
 */

/** Basic card/section surface: card background, hairline border, and card radius. */
export const adminCard = 'rounded-card border border-border bg-card'

/** Soft elevation instead of separation by borders alone. */
export const adminElevation = 'shadow-card'

/** Default elevated card: adminCard plus soft shadow, for lists, sections, and stats. */
export const adminCardRaised = `${adminCard} shadow-card`

/** Small card for stat chips and subcards: smaller radius and soft shadow. */
export const adminCardSm = 'rounded-xl border border-border bg-card shadow-card'

/** Subtle inset surface for segmented tracks, empty states, and code blocks. */
export const adminInset = 'bg-secondary'
