/**
 * @comwit/ui-templates — single source for interaction-state classes: focus, pressed, disabled, and ripple.
 *
 * The headless @comwit/ui engine has no Tailwind knowledge. Primitives own focus movement, ripple position,
 * and disabled behavior; all visuals come from here. Changing the focus-ring color once updates buttons,
 * chips, switches, and inputs together. Individual components must not define focus-visible:ring-… directly.
 */

/** Keyboard focus ring for surfaced interactive elements: buttons, chips, switches, and tabs. */
export const focusRing =
  'outline-none focus-visible:ring-focus focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background'

/** Input-field focus: brand-colored border plus a subtle ring without an offset. */
export const focusField =
  'outline-none focus-visible:border-ring focus-visible:ring-field focus-visible:ring-ring/20'

/** For containers such as InputGroup that display focus on behalf of an inner input. */
export const focusWithinField =
  'focus-within:border-ring focus-within:ring-field focus-within:ring-ring/20'

/** Shared pressed state and transitions: subtle scale plus color transitions. */
export const pressable =
  'transition-[background-color,border-color,color,box-shadow,transform] duration-fast active:scale-press'

/** Shared disabled state. Pair with text-disabled-foreground when dimming text. */
export const disabledStyle = 'disabled:pointer-events-none disabled:opacity-disabled'

/** Fields carrying aria-invalid. */
export const invalidField = 'aria-invalid:border-destructive aria-invalid:ring-destructive/20'

/**
 * Ripple-dot visuals passed as itemClassName to @comwit/ui useRipple/useCenterRipple.
 * Headless hooks own position and timing; this layer owns color, shape, and animation.
 * The animate-ripple keyframes are in styles/globals.css @theme.
 */
export const rippleItemClassName = 'animate-ripple rounded-full bg-current opacity-0'
