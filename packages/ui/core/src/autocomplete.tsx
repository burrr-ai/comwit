'use client'

/**
 * comwit-ui — autocomplete(combobox) 프리미티브 (라딕스식 compound · 스타일 0 · 앱 비의존).
 *
 * radix 엔 combobox 가 없어 **React Aria 를 내부 엔진**으로 삼는다 — 엔진은 구현 세부사항일 뿐,
 * 공개 표면은 다른 프리미티브와 같은 **headless 컴파운드**다. a11y · 키보드 내비게이션 · 필터 ·
 * open 상태 · 포커스 관리는 프리미티브가 전적으로 소유하고(파트가 context 로 받아 각자 배선),
 * 소비 레이어는 파트를 조립하며 className 만 입힌다.
 *
 *   <Autocomplete.Root collection={items.map((it) => <Autocomplete.Item key={it.key}>{it.name}</Autocomplete.Item>)}>
 *     <Autocomplete.Label>과일</Autocomplete.Label>
 *     <Autocomplete.Control>
 *       <Autocomplete.Input placeholder="검색" />
 *       <Autocomplete.Trigger><ChevronIcon /></Autocomplete.Trigger>
 *     </Autocomplete.Control>
 *     <Autocomplete.Content itemIndicator={<CheckIcon />} emptyState="결과 없음" />
 *   </Autocomplete.Root>
 *
 *  - 상태:   react-stately `useComboBoxState({ defaultFilter })` + `useFilter().contains` — Root 소유.
 *  - a11y:   react-aria `useComboBox` → labelProps/inputProps/buttonProps/listBoxProps 를 context 로 분배.
 *  - 컬렉션: react-stately 규약상 Item/Section **마커는 상태 훅에 직접 전달**돼야 한다(렌더 트리가 아니라
 *            데이터). 그래서 chrome(children)과 분리된 **`collection` prop** 으로 받는다. 옵션 li 렌더는
 *            react-aria(useOption)가 소유해야 해서 Content 가 내부 렌더 — per-item 시각은 Content 의
 *            itemClassName/itemIndicator 로 입힌다.
 *  - 라벨:   시각 라벨은 <Label> 파트가 렌더. aria-label/aria-labelledby 가 없으면 엔진에 라벨 존재를
 *            알려 label↔input id 를 연결하므로, **Label 파트를 렌더하거나 aria-label 을 넘겨야** 한다.
 *  - 폴리모피즘: asChild 는 Label/Control 만. Input/Trigger 는 react-aria 가 실제 <input>/<button> 에
 *            요소 특정 prop 을 스프레드하는 계약이라, 요소 교체가 aria 배선을 깨뜨린다(의도적 제외).
 *  - 구조 계약: Input/Trigger 는 Control 안에 두는 걸 권장(팝오버 앵커 + 폭 매칭). Control 이 없으면
 *            앵커는 input 으로 폴백한다.
 *
 * 방출 data-slot: autocomplete / -label / -control / -input / -trigger / -content /
 *                 -listbox / -item / -item-indicator / -empty / -section / -section-heading
 * 방출 data-*: Root·Input·Trigger 에 data-state("open"|"closed") · Root 에 data-disabled/data-invalid
 *              (item): data-focused / data-selected / data-disabled
 * 방출 CSS var(content): --cw-autocomplete-anchor-width (컨트롤 폭 — 팝오버 폭 매칭용)
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

/* ── context (파트 간 상태/배선 공유 — 소비처 비노출) ─────────────────── */

// context 는 제네릭일 수 없어 T 를 object 로 지운다(내부 전용 — 파트는 아이템 타입을 몰라도 된다).
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
  /** 팝오버 앵커 — Control 이 있으면 컨트롤 박스, 없으면 input 으로 폴백 */
  anchorRef: React.RefObject<Element | null>
  anchorWidth: number | undefined
  setAnchorWidth: React.Dispatch<React.SetStateAction<number | undefined>>
}

const AutocompleteContext = React.createContext<AutocompleteContextValue | null>(null)

function useAutocompleteContext(part: string): AutocompleteContextValue {
  const ctx = React.useContext(AutocompleteContext)
  if (!ctx) {
    throw new Error(
      `comwit-ui: <Autocomplete.${part}> 는 <Autocomplete.Root> 안에서만 쓸 수 있습니다.`
    )
  }
  return ctx
}

const getState = (open: boolean) => (open ? 'open' : 'closed')

/* ── Root ────────────────────────────────────────────────────────── */

type RootProps<T extends object = object> = Omit<AriaComboBoxProps<T>, 'children' | 'label'> &
  // 상태 훅에만 있는(useComboBox 엔 없는) 옵션 — 빈 컬렉션 허용/blur 닫기.
  Pick<ComboBoxStateOptions<T>, 'allowsEmptyCollection' | 'shouldCloseOnBlur'> & {
    /** react-stately 컬렉션 마커(Item/Section) 또는 items 렌더 함수 — 상태 훅에 직접 전달된다. */
    collection?: ComboBoxStateOptions<T>['children']
    /** chrome — 소비처가 조립하는 서브파트(Label/Control/Input/Trigger/Content …). */
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

  // 시각 라벨은 <Label> 파트가 렌더한다. 엔진엔 존재만 알려(label: true) label↔input id 연결을
  // 만들게 하고, aria-label(ledby) 가 오면 그것이 이름이므로 켜지 않는다.
  const hasAriaLabel = comboProps['aria-label'] != null || comboProps['aria-labelledby'] != null
  const engineProps = { ...comboProps, label: hasAriaLabel ? undefined : true }

  // 컬렉션 마커(Item/Section)는 렌더 트리가 아니라 상태 훅의 데이터로 들어간다(react-stately 규약).
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

  // 팝오버 앵커: Control 박스 기준, Control 을 안 쓰면 input 으로 폴백(파생 ref — 쓰기 없음).
  const anchorRef = React.useMemo(() => {
    return {
      get current() {
        return controlRef.current ?? inputRef.current
      },
    } as React.RefObject<Element | null>
  }, [])

  const ctx: AutocompleteContextValue = {
    // 제네릭 T 는 context 경계에서 지운다(내부 전용 — 파트는 노드 렌더값만 다룬다).
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

/* ── Control (input + trigger 를 감싸는 박스 — 팝오버 앵커/폭 기준) ── */

type ControlProps = React.ComponentProps<'div'> & { asChild?: boolean }

function Control({ asChild, ref, ...props }: ControlProps) {
  const { controlRef, setAnchorWidth } = useAutocompleteContext('Control')
  const composedRef = useComposedRefs(controlRef, ref)

  // 컨트롤 폭 측정 → 팝오버 폭 매칭용 CSS var(--cw-autocomplete-anchor-width).
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

  // Slot 도 div 와 동일한 prop/ref 계약으로 머지하므로 타입만 div 로 좁힌다(런타임 동일).
  const Comp = (asChild ? Slot : 'div') as 'div'
  return <Comp data-slot="autocomplete-control" {...props} ref={composedRef} />
}

/* ── Input (aria 배선상 실제 <input> 이어야 한다 — asChild 없음) ───── */

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

/* ── Trigger (aria 배선상 실제 <button> — asChild 없음. 포커스는 input 에 유지) ── */

type TriggerProps = React.ComponentProps<'button'>

function Trigger({ ref, ...props }: TriggerProps) {
  const ctx = useAutocompleteContext('Trigger')
  const composedRef = useComposedRefs(ctx.buttonRef, ref)
  return (
    <button
      data-slot="autocomplete-trigger"
      data-state={getState(ctx.state.isOpen)}
      // aria combobox 패턴: 포커스는 input 에 유지 — 소비자가 명시하면 그 값이 우선.
      {...mergeProps(ctx.buttonProps, { tabIndex: -1 }, props)}
      ref={composedRef}
    />
  )
}

/* ── Content (open 일 때만 마운트 — usePopover/useListBox 훅은 Impl 에) ── */

type ContentProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  /** 개별 옵션(li) 공통 클래스 — 옵션 렌더는 react-aria(useOption)가 소유해서 Content 가 내부 렌더. */
  itemClassName?: string
  /** 선택된 옵션에 표시할 표식(예: Check 아이콘). */
  itemIndicator?: React.ReactNode
  /** 결과 없음 표시(allowsEmptyCollection 과 함께). */
  emptyState?: React.ReactNode
  /** 리스트 뒤에 붙일 추가 노드(footer 등). */
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

/* ── Section (내부 렌더 — 마커는 Autocomplete.Section) ────────────── */

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

/* ── Option (내부 렌더 — 마커는 Autocomplete.Item) ─────────────────── */

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

// 컴파운드 파트 + 컬렉션 마커(Item/Section — react-stately 재수출).
export { Root, Label, Control, Input, Trigger, Content, Item, Section }
export type { RootProps, LabelProps, ControlProps, InputProps, TriggerProps, ContentProps }
