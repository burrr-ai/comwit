'use client'

/**
 * Headless compound autocomplete powered internally by React Aria. Root owns useComboBoxState/useFilter state and distributes useComboBox accessibility props through context; consumers assemble and style parts. Pass Item/Section collection markers through collection, separately from visual children, because react-stately consumes them as data. Content renders options with useOption; use itemClassName/itemIndicator for their appearance. Render Label or provide aria-label/aria-labelledby. Only Label/Control support asChild: Input and Trigger must remain native input/button elements for ARIA wiring. Place Input and Trigger inside Control for anchoring and width matching; without Control the input is the anchor. Example: <Autocomplete.Root collection={<Autocomplete.Item key="apple">Apple</Autocomplete.Item>}><Autocomplete.Label>Fruit</Autocomplete.Label><Autocomplete.Control><Autocomplete.Input placeholder="Search" /><Autocomplete.Trigger>Open</Autocomplete.Trigger></Autocomplete.Control><Autocomplete.Content emptyState="No results" /></Autocomplete.Root>. Slots cover root, label, control, input, trigger, content, listbox, item, item-indicator, empty, section, and section-heading. Root/Input/Trigger expose open/closed data-state; Root exposes disabled/invalid; items expose focused/selected/disabled. Content receives --cw-autocomplete-anchor-width.
 */

import * as React from 'react'
import {
  useComboBox,
  useListBox,
  useListBoxSection,
  useOption,
  useButton,
  useFilter,
  usePopover,
  Overlay,
  DismissButton,
  mergeProps,
  type AriaComboBoxOptions,
  type AriaComboBoxProps,
  type AriaListBoxOptions,
} from 'react-aria'
import {
  useComboBoxState,
  Item,
  Section,
  type ComboBoxState,
  type ComboBoxStateOptions,
  type Node,
} from 'react-stately'
import { Slot } from './slot'
import { useComposedRefs } from './internal/compose-refs'

/* Internal context shares state and wiring between parts. */

// Erase T to object at the context boundary; internal parts do not need the item type.
type ComboAria = ReturnType<typeof useComboBox<object>>

type AutocompleteContextValue = {
  state: ComboBoxState<object>
  labelProps: ComboAria['labelProps']
  inputProps: ComboAria['inputProps']
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>
  listBoxProps: ComboAria['listBoxProps']
  inputRef: React.RefObject<HTMLInputElement | null>
  listBoxRef: React.RefObject<HTMLUListElement | null>
  popoverRef: React.RefObject<HTMLDivElement | null>
  buttonRef: React.RefObject<HTMLButtonElement | null>
  controlRef: React.RefObject<HTMLDivElement | null>
  /** Popover anchor: Control when present, otherwise the input. */
  anchorRef: React.RefObject<Element | null>
  anchorWidth: number | undefined
  setAnchorWidth: React.Dispatch<React.SetStateAction<number | undefined>>
}

const AutocompleteContext = React.createContext<AutocompleteContextValue | null>(null)

function useAutocompleteContext(part: string): AutocompleteContextValue {
  const ctx = React.useContext(AutocompleteContext)
  if (!ctx) {
    throw new Error(`comwit-ui: <Autocomplete.${part}> must be used inside <Autocomplete.Root>.`)
  }
  return ctx
}

const getState = (open: boolean) => (open ? 'open' : 'closed')

/* ── Root ────────────────────────────────────────────────────────── */

type RootProps<T extends object = object> = Omit<AriaComboBoxProps<T>, 'children' | 'label'> &
  // State-hook options absent from useComboBox: empty collections and closing on blur.
  Pick<ComboBoxStateOptions<T>, 'allowsEmptyCollection' | 'shouldCloseOnBlur'> & {
    /** react-stately Item/Section markers or an item renderer, passed directly to the state hook. */
    collection?: ComboBoxStateOptions<T>['children']
    /** Visual children assembled by consumers: Label, Control, Input, Trigger, Content, and other parts. */
    children?: React.ReactNode
    className?: string
    style?: React.CSSProperties
  }

function Root<T extends object = object>(props: RootProps<T>) {
  const { collection, children, className, style, ...comboProps } = props

  const { contains } = useFilter({ sensitivity: 'base' })

  const inputRef = React.useRef<HTMLInputElement>(null)
  const listBoxRef = React.useRef<HTMLUListElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const controlRef = React.useRef<HTMLDivElement>(null)
  const [anchorWidth, setAnchorWidth] = React.useState<number>()

  // Label renders the visible label. Set label: true only to let the engine connect label/input IDs;
  // an explicit aria-label or aria-labelledby already supplies the accessible name.
  const hasAriaLabel = comboProps['aria-label'] != null || comboProps['aria-labelledby'] != null
  const engineProps = { ...comboProps, label: hasAriaLabel ? undefined : true }

  // Collection markers are state-hook data rather than rendered children, as required by react-stately.
  const state = useComboBoxState<T>({
    ...engineProps,
    defaultFilter: contains,
    children: collection as ComboBoxStateOptions<T>['children'],
  })

  const comboOptions: AriaComboBoxOptions<T> = {
    ...engineProps,
    inputRef,
    listBoxRef,
    popoverRef,
    buttonRef,
  }
  const {
    labelProps,
    inputProps,
    listBoxProps,
    buttonProps: comboButtonProps,
  } = useComboBox<T>(comboOptions, state)
  const { buttonProps } = useButton(comboButtonProps, buttonRef)

  // Anchor to Control, falling back to input through a derived read-only ref.
  const anchorRef = React.useMemo(() => {
    return {
      get current() {
        return controlRef.current ?? inputRef.current
      },
    } as React.RefObject<Element | null>
  }, [])

  const ctx: AutocompleteContextValue = {
    // Erase generic T at the internal context boundary; parts only handle rendered node values.
    state: state as unknown as ComboBoxState<object>,
    labelProps,
    inputProps,
    buttonProps,
    listBoxProps: listBoxProps as unknown as ComboAria['listBoxProps'],
    inputRef,
    listBoxRef,
    popoverRef,
    buttonRef,
    controlRef,
    anchorRef,
    anchorWidth,
    setAnchorWidth,
  }

  return (
    <AutocompleteContext.Provider value={ctx}>
      <div
        data-slot="autocomplete"
        data-state={getState(state.isOpen)}
        data-disabled={comboProps.isDisabled ? 'true' : undefined}
        data-invalid={comboProps.isInvalid ? 'true' : undefined}
        className={className}
        style={style}
      >
        {children}
      </div>
    </AutocompleteContext.Provider>
  )
}

/* ── Label ───────────────────────────────────────────────────────── */

type LabelProps = React.ComponentProps<'label'> & { asChild?: boolean }

function Label({ asChild, ...props }: LabelProps) {
  const ctx = useAutocompleteContext('Label')
  const Comp = asChild ? Slot : 'label'
  return <Comp data-slot="autocomplete-label" {...mergeProps(ctx.labelProps, props)} />
}

/* Control wraps input and trigger and defines the popover anchor and width. */

type ControlProps = React.ComponentProps<'div'> & { asChild?: boolean }

function Control({ asChild, ref, ...props }: ControlProps) {
  const { controlRef, setAnchorWidth } = useAutocompleteContext('Control')
  const composedRef = useComposedRefs(controlRef, ref)

  // Measure Control width into --cw-autocomplete-anchor-width for popover matching.
  React.useEffect(() => {
    const node = controlRef.current
    if (!node) return
    const measure = () => setAnchorWidth(node.getBoundingClientRect().width)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [controlRef, setAnchorWidth])

  // Slot merges the same props/ref contract as div; narrow the type without changing runtime behavior.
  const Comp = (asChild ? Slot : 'div') as 'div'
  return <Comp data-slot="autocomplete-control" {...props} ref={composedRef} />
}

/* Input must be a native input for ARIA wiring; no asChild. */

type InputProps = React.ComponentProps<'input'>

function Input({ ref, ...props }: InputProps) {
  const ctx = useAutocompleteContext('Input')
  const composedRef = useComposedRefs(ctx.inputRef, ref)
  return (
    <input
      data-slot="autocomplete-input"
      data-state={getState(ctx.state.isOpen)}
      {...mergeProps(ctx.inputProps, props)}
      ref={composedRef}
    />
  )
}

/* Trigger must be a native button; no asChild. Keep focus on the input. */

type TriggerProps = React.ComponentProps<'button'>

function Trigger({ ref, ...props }: TriggerProps) {
  const ctx = useAutocompleteContext('Trigger')
  const composedRef = useComposedRefs(ctx.buttonRef, ref)
  return (
    <button
      data-slot="autocomplete-trigger"
      data-state={getState(ctx.state.isOpen)}
      // The ARIA combobox pattern keeps input focus; explicit consumer props take precedence.
      {...mergeProps(ctx.buttonProps, { tabIndex: -1 }, props)}
      ref={composedRef}
    />
  )
}

/* Content mounts only while open; Impl owns usePopover and useListBox hooks. */

type ContentProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  /** Shared class for option li elements rendered internally through React Aria useOption. */
  itemClassName?: string
  /** Indicator for the selected option, such as a check icon. */
  itemIndicator?: React.ReactNode
  /** Empty-results content, used with allowsEmptyCollection. */
  emptyState?: React.ReactNode
  /** Additional content after the list, such as a footer. */
  children?: React.ReactNode
}

function Content(props: ContentProps) {
  const ctx = useAutocompleteContext('Content')
  if (!ctx.state.isOpen) return null
  return <ContentImpl {...props} />
}

function ContentImpl({
  itemClassName,
  itemIndicator,
  emptyState,
  children,
  ref,
  style,
  ...props
}: ContentProps) {
  const ctx = useAutocompleteContext('Content')
  const { state, anchorRef, popoverRef, listBoxRef, anchorWidth } = ctx

  const { popoverProps } = usePopover(
    {
      triggerRef: anchorRef,
      popoverRef,
      isNonModal: true,
      placement: 'bottom start',
      offset: 4,
    },
    state
  )
  const { listBoxProps } = useListBox(ctx.listBoxProps, state, listBoxRef)
  const composedRef = useComposedRefs(popoverRef, ref)

  const isEmpty = state.collection.size === 0

  const mergedStyle: React.CSSProperties = {
    ...popoverProps.style,
    ['--cw-autocomplete-anchor-width' as string]:
      anchorWidth != null ? `${anchorWidth}px` : undefined,
    ...style,
  }

  return (
    <Overlay>
      <div
        {...mergeProps(popoverProps, props)}
        ref={composedRef}
        style={mergedStyle}
        data-slot="autocomplete-content"
        data-state="open"
      >
        <DismissButton onDismiss={state.close} />
        <ul {...listBoxProps} ref={listBoxRef} data-slot="autocomplete-listbox">
          {isEmpty ? (
            <li role="presentation" data-slot="autocomplete-empty">
              {emptyState}
            </li>
          ) : (
            [...state.collection].map((node) =>
              node.type === 'section' ? (
                <ListSection
                  key={node.key}
                  section={node}
                  state={state}
                  itemClassName={itemClassName}
                  itemIndicator={itemIndicator}
                />
              ) : (
                <Option
                  key={node.key}
                  node={node}
                  state={state}
                  itemClassName={itemClassName}
                  itemIndicator={itemIndicator}
                />
              )
            )
          )}
        </ul>
        {children}
        <DismissButton onDismiss={state.close} />
      </div>
    </Overlay>
  )
}

/* Internal section renderer; Autocomplete.Section is the collection marker. */

function ListSection<T extends object>({
  section,
  state,
  itemClassName,
  itemIndicator,
}: {
  section: Node<T>
  state: ComboBoxState<T>
  itemClassName?: string
  itemIndicator?: React.ReactNode
}) {
  const { itemProps, headingProps, groupProps } = useListBoxSection({
    heading: section.rendered,
    'aria-label': section.textValue || undefined,
  })

  return (
    <li {...itemProps} data-slot="autocomplete-section">
      {section.rendered != null ? (
        <span {...headingProps} data-slot="autocomplete-section-heading">
          {section.rendered}
        </span>
      ) : null}
      <ul {...groupProps}>
        {[...section.childNodes].map((node) => (
          <Option
            key={node.key}
            node={node}
            state={state}
            itemClassName={itemClassName}
            itemIndicator={itemIndicator}
          />
        ))}
      </ul>
    </li>
  )
}

/* Internal option renderer; Autocomplete.Item is the collection marker. */

function Option<T extends object>({
  node,
  state,
  itemClassName,
  itemIndicator,
}: {
  node: Node<T>
  state: ComboBoxState<T>
  itemClassName?: string
  itemIndicator?: React.ReactNode
}) {
  const ref = React.useRef<HTMLLIElement>(null)
  const { optionProps, isSelected, isFocused, isDisabled } = useOption(
    { key: node.key },
    state,
    ref
  )

  return (
    <li
      {...optionProps}
      ref={ref}
      className={itemClassName}
      data-slot="autocomplete-item"
      data-focused={isFocused || undefined}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}
    >
      {node.rendered}
      {isSelected && itemIndicator != null ? (
        <span data-slot="autocomplete-item-indicator">{itemIndicator}</span>
      ) : null}
    </li>
  )
}

/* ── exports ─────────────────────────────────────────────────────── */

// Compound parts and react-stately Item/Section collection markers.
export { Root, Label, Control, Input, Trigger, Content, Item, Section }
export type { RootProps, LabelProps, ControlProps, InputProps, TriggerProps, ContentProps }
