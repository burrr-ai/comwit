'use client'

/**
 * comwit-ui — unstyled, app-independent text-field primitive (Radix-style compound component, equivalent to MUI TextField).
 *
 * Owns text field accessibility, IME composition, and focus state. The consumer layer (lib/components/ui) only
 * applies cva/Tailwind styles.
 * - React Aria useField wires IDs, label/control relationships, aria-describedby, and aria-invalid. Radix has no
 *   general text-field primitive, so React Aria supplies the established ARIA implementation.
 * - Adds Korean IME composition and focus state as data-* attributes.
 * - Leaves filled state to consumer CSS :placeholder-shown, which handles autofill and initial values more reliably.
 *
 *   <TextField.Root isInvalid isRequired>
 *     <TextField.Label>Name</TextField.Label>
 *     <TextField.Control><input /></TextField.Control>
 *     <TextField.Description>Help text</TextField.Description>
 *     <TextField.Error>Required</TextField.Error>
 *   </TextField.Root>
 *
 * Root CSS hooks: data-focused / data-invalid / data-disabled / data-composing.
 */

import * as React from 'react'
import { useField as useAriaField } from '@react-aria/label'
import { Slot } from './slot'
import { useLayoutEffect } from './internal/use-layout-effect'

type Aria = ReturnType<typeof useAriaField>

// Widen handler event targets to HTMLElement for compatibility with Slot.
type ControlExtra = {
  onFocus: React.FocusEventHandler<HTMLElement>
  onBlur: React.FocusEventHandler<HTMLElement>
  onCompositionStart: React.CompositionEventHandler<HTMLElement>
  onCompositionEnd: React.CompositionEventHandler<HTMLElement>
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  disabled?: boolean
}

type FieldContextValue = {
  labelProps: Aria['labelProps']
  controlProps: Aria['fieldProps'] & ControlExtra
  descriptionProps: Aria['descriptionProps']
  errorProps: Aria['errorMessageProps'] & { role: 'alert'; 'aria-live': 'polite' }
  /** Description/Error parts register their presence on mount and return an unregister function; see Root's presence detection. */
  registerDescription: () => () => void
  registerError: () => () => void
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

function useFieldContext(part: string): FieldContextValue {
  const ctx = React.useContext(FieldContext)
  if (!ctx) {
    throw new Error(`comwit-ui: <TextField.${part}> must be used inside <TextField.Root>.`)
  }
  return ctx
}

const flag = (on: boolean) => (on ? 'true' : undefined)

/* ── Root ────────────────────────────────────────────────────────── */

type RootProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  asChild?: boolean
  isInvalid?: boolean
  isRequired?: boolean
  isDisabled?: boolean
  children?: React.ReactNode
}

function Root({
  asChild,
  isInvalid = false,
  isRequired = false,
  isDisabled = false,
  children,
  ...props
}: RootProps) {
  // Determine Description/Error presence from the union of two sources.
  //   1) Direct-child scan: deterministic in SSR markup, without hydration mismatches; covers the documented composition.
  //   2) Mount registration: parts wrapped in layout elements (such as <Root><div><Description/></div></Root>)
  //      register through a layout effect to keep aria-describedby connected. This supplements the DOM after
  //      hydration without affecting SSR; screen readers read the live DOM, so accessibility is preserved.
  const kids = React.Children.toArray(children)
  const [descriptionCount, setDescriptionCount] = React.useState(0)
  const [errorCount, setErrorCount] = React.useState(0)
  const registerDescription = React.useCallback(() => {
    setDescriptionCount((n) => n + 1)
    return () => setDescriptionCount((n) => n - 1)
  }, [])
  const registerError = React.useCallback(() => {
    setErrorCount((n) => n + 1)
    return () => setErrorCount((n) => n - 1)
  }, [])
  const hasDescription =
    descriptionCount > 0 || kids.some((c) => React.isValidElement(c) && c.type === Description)
  const hasError =
    errorCount > 0 || kids.some((c) => React.isValidElement(c) && c.type === ErrorMessage)

  // React Aria generates IDs, connects labels to controls, and combines descriptions/errors in aria-describedby.
  const { labelProps, fieldProps, descriptionProps, errorMessageProps } = useAriaField({
    label: true,
    description: hasDescription || undefined,
    errorMessage: hasError || undefined,
    isInvalid,
  })

  const [isFocused, setFocused] = React.useState(false)
  const [isComposing, setComposing] = React.useState(false)

  const controlHandlers = React.useMemo<ControlExtra>(
    () => ({
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      onCompositionStart: () => setComposing(true),
      onCompositionEnd: () => setComposing(false),
    }),
    []
  )

  const ctx: FieldContextValue = {
    labelProps,
    controlProps: {
      ...fieldProps,
      ...controlHandlers,
      'aria-invalid': isInvalid || undefined,
      'aria-required': isRequired || undefined,
      disabled: isDisabled || undefined,
    },
    descriptionProps,
    errorProps: {
      ...errorMessageProps,
      role: 'alert',
      'aria-live': 'polite',
    },
    registerDescription,
    registerError,
  }

  const Comp = asChild ? Slot : 'div'

  return (
    <FieldContext.Provider value={ctx}>
      <Comp
        data-slot="field"
        data-focused={flag(isFocused)}
        data-invalid={flag(isInvalid)}
        data-disabled={flag(isDisabled)}
        data-composing={flag(isComposing)}
        {...props}
      >
        {children}
      </Comp>
    </FieldContext.Provider>
  )
}

/* ── Label ───────────────────────────────────────────────────────── */

type LabelProps = React.ComponentProps<'label'> & { asChild?: boolean }

function Label({ asChild, ...props }: LabelProps) {
  const ctx = useFieldContext('Label')
  const Comp = asChild ? Slot : 'label'
  return <Comp data-slot="field-label" {...ctx.labelProps} {...props} />
}

/* ── Control (Slot: merge accessibility and IME behavior into a child input/textarea) ── */

function Control({ children }: { children: React.ReactElement }) {
  const ctx = useFieldContext('Control')
  // Slot automatically composes our controlProps handlers with the consumer child's handlers.
  return (
    <Slot data-slot="field-control" {...ctx.controlProps}>
      {children}
    </Slot>
  )
}

/* ── Description / Error ──────────────────────────────────────────── */

type DescriptionProps = React.ComponentProps<'p'> & { asChild?: boolean }

function Description({ asChild, ...props }: DescriptionProps) {
  const { descriptionProps, registerDescription } = useFieldContext('Description')
  // Register on mount so Root detects this part even when layout wrappers make it an indirect child.
  useLayoutEffect(() => registerDescription(), [registerDescription])
  const Comp = asChild ? Slot : 'p'
  return <Comp data-slot="field-description" {...descriptionProps} {...props} />
}

type ErrorProps = React.ComponentProps<'p'> & { asChild?: boolean }

function ErrorMessage({ asChild, ...props }: ErrorProps) {
  const { errorProps, registerError } = useFieldContext('Error')
  // Register on mount so Root detects this part even when layout wrappers make it an indirect child.
  useLayoutEffect(() => registerError(), [registerError])
  const Comp = asChild ? Slot : 'p'
  return <Comp data-slot="field-error" {...errorProps} {...props} />
}

/*
 * NotchedOutline (MUI NotchedOutline equivalent).
 * Provides a true structural notch for outlined fields: it omits a segment of the top border instead of
 * covering it with a background color, so gray surfaces, cards, gradients, and images work correctly.
 * - fieldset: border overlay above the input; the consumer skin supplies color, rings, and radius.
 * - legend: as the first child of fieldset, native HTML layout interrupts the top border across its width.
 * - Notch copy: an invisible copy of the floating label inside legend makes the gap match the label width
 *   automatically, without measurement or JS.
 * The entire outline is aria-hidden so screen readers read only the actual Label. It is unstyled; consumers
 * supply colors, dimensions, and transitions through className (fieldset) and notchClassName (legend).
 *
 * Layout contract: place the input peer before NotchedOutline. Selectors such as peer-focus:[&>legend]:…
 * can then open/close the notch using the same trigger as the floating label.
 */
type NotchedOutlineProps = Omit<React.ComponentProps<'fieldset'>, 'children'> & {
  /** Invisible label copy rendered in legend to reserve width. Pass the same node as the floating Label. */
  notch?: React.ReactNode
  /** Classes for legend, such as the notch gap collapse/expand transition. */
  notchClassName?: string
}

function NotchedOutline({ notch, notchClassName, ...props }: NotchedOutlineProps) {
  return (
    <fieldset aria-hidden="true" data-slot="field-outline" {...props}>
      <legend data-slot="field-notch" className={notchClassName}>
        <span>{notch}</span>
      </legend>
    </fieldset>
  )
}

export { Root, Label, Control, Description, ErrorMessage as Error, NotchedOutline }
