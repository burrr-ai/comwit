/**
 * comwit-ui — radio-group. Radix Primitives 구현을 그대로 이식한 자체 엔진 (외부 Radix 패키지 의존성 없음).
 */
import * as React from 'react'
import { composeEventHandlers } from './internal/compose-event-handlers'
import { useComposedRefs } from './internal/compose-refs'
import { createContextScope } from './internal/context'
import { Primitive } from './internal/primitive'
import * as RovingFocusGroup from './internal/roving-focus-group'
import { createRovingFocusGroupScope } from './internal/roving-focus-group'
import { useControllableState } from './internal/use-controllable-state'
import { useDirection } from './internal/direction'
import { useSize } from './internal/use-size'
import { usePrevious } from './internal/use-previous'
import { Presence } from './internal/presence'

import type { Scope } from './internal/context'

/* -------------------------------------------------------------------------------------------------
 * Radio (module-private implementation detail of RadioGroup)
 * -----------------------------------------------------------------------------------------------*/

const RADIO_NAME = 'Radio'

type ScopedPropsRadio<P> = P & { __scopeRadio?: Scope }
const [createRadioContext, createRadioScope] = createContextScope(RADIO_NAME)

type RadioContextValue = {
  checked: boolean
  disabled: boolean | undefined
  required: boolean | undefined
  name: string | undefined
  form: string | undefined
  value: string | number | readonly string[]
  control: HTMLButtonElement | null
  setControl: React.Dispatch<React.SetStateAction<HTMLButtonElement | null>>
  hasConsumerStoppedPropagationRef: React.RefObject<boolean>
  isFormControl: boolean
  bubbleInput: HTMLInputElement | null
  setBubbleInput: React.Dispatch<React.SetStateAction<HTMLInputElement | null>>
  onCheck(): void
}

const [RadioProviderImpl, useRadioContext] = createRadioContext<RadioContextValue>(RADIO_NAME)

/* -------------------------------------------------------------------------------------------------
 * RadioProvider
 * -----------------------------------------------------------------------------------------------*/

interface RadioProviderProps {
  checked?: boolean
  required?: boolean
  disabled?: boolean
  name?: string
  form?: string
  value?: string | number | readonly string[]
  onCheck?(): void
  children?: React.ReactNode
}

function RadioProvider(props: ScopedPropsRadio<RadioProviderProps>) {
  const {
    __scopeRadio,
    checked = false,
    children,
    disabled,
    form,
    name,
    onCheck,
    required,
    value = 'on',
    // @ts-expect-error
    internal_do_not_use_render,
  } = props

  const [control, setControl] = React.useState<HTMLButtonElement | null>(null)
  const [bubbleInput, setBubbleInput] = React.useState<HTMLInputElement | null>(null)
  const hasConsumerStoppedPropagationRef = React.useRef(false)
  const isFormControl = control
    ? !!form || !!control.closest('form')
    : // We set this to true by default so that events bubble to forms without JS (SSR)
      true

  const context: RadioContextValue = {
    checked,
    disabled,
    required,
    name,
    form,
    value,
    control,
    setControl,
    hasConsumerStoppedPropagationRef,
    isFormControl,
    bubbleInput,
    setBubbleInput,
    onCheck: () => onCheck?.(),
  }

  return (
    <RadioProviderImpl scope={__scopeRadio} {...context}>
      {isFunction(internal_do_not_use_render) ? internal_do_not_use_render(context) : children}
    </RadioProviderImpl>
  )
}

/* -------------------------------------------------------------------------------------------------
 * RadioTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = 'RadioTrigger'

interface RadioTriggerProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Primitive.button>,
  keyof RadioProviderProps
> {
  children?: React.ReactNode
}

const RadioTrigger = React.forwardRef<HTMLButtonElement, RadioTriggerProps>(
  ({ __scopeRadio, onClick, ...radioProps }: ScopedPropsRadio<RadioTriggerProps>, forwardedRef) => {
    const {
      checked,
      disabled,
      value,
      setControl,
      onCheck,
      hasConsumerStoppedPropagationRef,
      isFormControl,
      bubbleInput,
    } = useRadioContext(TRIGGER_NAME, __scopeRadio)
    const composedRefs = useComposedRefs(forwardedRef, setControl)

    return (
      <Primitive.button
        type="button"
        role="radio"
        aria-checked={checked}
        data-state={getState(checked)}
        data-disabled={disabled ? '' : undefined}
        disabled={disabled}
        value={value}
        {...radioProps}
        ref={composedRefs}
        onClick={composeEventHandlers(onClick, (event) => {
          // radios cannot be unchecked so we only communicate a checked state
          if (!checked) onCheck()
          if (bubbleInput && isFormControl) {
            hasConsumerStoppedPropagationRef.current = event.isPropagationStopped()
            // if radio has a bubble input and is a form control, stop propagation
            // from the button so that we only propagate one click event (from the
            // input). We propagate changes from an input so that native form
            // validation works and form events reflect radio updates.
            if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation()
          }
        })}
      />
    )
  }
)

RadioTrigger.displayName = TRIGGER_NAME

/* -------------------------------------------------------------------------------------------------
 * Radio
 * -----------------------------------------------------------------------------------------------*/

type RadioElement = React.ComponentRef<typeof Primitive.button>
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>
interface RadioProps extends Omit<PrimitiveButtonProps, 'checked'> {
  checked?: boolean
  required?: boolean
  onCheck?(): void
}

const Radio = React.forwardRef<RadioElement, RadioProps>(
  (props: ScopedPropsRadio<RadioProps>, forwardedRef) => {
    const { __scopeRadio, name, checked, required, disabled, value, onCheck, form, ...radioProps } =
      props

    return (
      <RadioProvider
        __scopeRadio={__scopeRadio}
        checked={checked}
        disabled={disabled}
        required={required}
        onCheck={onCheck}
        name={name}
        form={form}
        value={value}
        // @ts-expect-error
        internal_do_not_use_render={({ isFormControl }: RadioContextValue) => (
          <>
            <RadioTrigger
              {...radioProps}
              ref={forwardedRef}
              // @ts-expect-error
              __scopeRadio={__scopeRadio}
            />
            {isFormControl && (
              <RadioBubbleInput
                // @ts-expect-error
                __scopeRadio={__scopeRadio}
              />
            )}
          </>
        )}
      />
    )
  }
)

Radio.displayName = RADIO_NAME

/* -------------------------------------------------------------------------------------------------
 * RadioIndicator
 * -----------------------------------------------------------------------------------------------*/

const RADIO_INDICATOR_NAME = 'RadioIndicator'

type RadioIndicatorElement = React.ComponentRef<typeof Primitive.span>
type PrimitiveSpanProps = React.ComponentPropsWithoutRef<typeof Primitive.span>
interface RadioIndicatorProps extends PrimitiveSpanProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with React animation libraries.
   */
  forceMount?: true
}

const RadioIndicator = React.forwardRef<RadioIndicatorElement, RadioIndicatorProps>(
  (props: ScopedPropsRadio<RadioIndicatorProps>, forwardedRef) => {
    const { __scopeRadio, forceMount, ...indicatorProps } = props
    const context = useRadioContext(RADIO_INDICATOR_NAME, __scopeRadio)
    return (
      <Presence present={forceMount || context.checked}>
        <Primitive.span
          data-state={getState(context.checked)}
          data-disabled={context.disabled ? '' : undefined}
          {...indicatorProps}
          ref={forwardedRef}
        />
      </Presence>
    )
  }
)

RadioIndicator.displayName = RADIO_INDICATOR_NAME

/* -------------------------------------------------------------------------------------------------
 * RadioBubbleInput
 * -----------------------------------------------------------------------------------------------*/

const RADIO_BUBBLE_INPUT_NAME = 'RadioBubbleInput'

type InputProps = React.ComponentPropsWithoutRef<typeof Primitive.input>
interface RadioBubbleInputProps extends Omit<InputProps, 'checked'> {}

const RadioBubbleInput = React.forwardRef<HTMLInputElement, RadioBubbleInputProps>(
  ({ __scopeRadio, ...props }: ScopedPropsRadio<RadioBubbleInputProps>, forwardedRef) => {
    const {
      control,
      checked,
      required,
      disabled,
      name,
      value,
      form,
      bubbleInput,
      setBubbleInput,
      hasConsumerStoppedPropagationRef,
    } = useRadioContext(RADIO_BUBBLE_INPUT_NAME, __scopeRadio)

    const composedRefs = useComposedRefs(forwardedRef, setBubbleInput)
    const prevChecked = usePrevious(checked)
    const controlSize = useSize(control)

    // Bubble checked change to parents (e.g form change event)
    React.useEffect(() => {
      const input = bubbleInput
      if (!input) return

      const inputProto = window.HTMLInputElement.prototype
      const descriptor = Object.getOwnPropertyDescriptor(
        inputProto,
        'checked'
      ) as PropertyDescriptor
      const setChecked = descriptor.set

      const bubbles = !hasConsumerStoppedPropagationRef.current
      if (prevChecked !== checked && setChecked) {
        const event = new Event('click', { bubbles })
        setChecked.call(input, checked)
        input.dispatchEvent(event)
      }
    }, [bubbleInput, prevChecked, checked, hasConsumerStoppedPropagationRef])

    const defaultCheckedRef = React.useRef(checked)
    return (
      <Primitive.input
        type="radio"
        aria-hidden
        defaultChecked={defaultCheckedRef.current}
        required={required}
        disabled={disabled}
        name={name}
        value={value}
        form={form}
        {...props}
        tabIndex={-1}
        ref={composedRefs}
        style={{
          ...props.style,
          ...controlSize,
          position: 'absolute',
          pointerEvents: 'none',
          opacity: 0,
          margin: 0,
          // We transform because the input is absolutely positioned but we have
          // rendered it **after** the button. This pulls it back to sit on top
          // of the button.
          transform: 'translateX(-100%)',
        }}
      />
    )
  }
)

RadioBubbleInput.displayName = RADIO_BUBBLE_INPUT_NAME

/* ---------------------------------------------------------------------------------------------- */

function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function'
}

function getState(checked: boolean) {
  return checked ? 'checked' : 'unchecked'
}

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

/* -------------------------------------------------------------------------------------------------
 * RadioGroup
 * -----------------------------------------------------------------------------------------------*/
const RADIO_GROUP_NAME = 'RadioGroup'

type ScopedProps<P> = P & { __scopeRadioGroup?: Scope }
const [createRadioGroupContext, createRadioGroupScope] = createContextScope(RADIO_GROUP_NAME, [
  createRovingFocusGroupScope,
  createRadioScope,
])
const useRovingFocusGroupScope = createRovingFocusGroupScope()
const useRadioScope = createRadioScope()

type RadioGroupContextValue = {
  name?: string
  form?: string
  required: boolean
  disabled: boolean
  value: string | null
  onValueChange(value: string): void
}

const [RadioGroupProvider, useRadioGroupContext] =
  createRadioGroupContext<RadioGroupContextValue>(RADIO_GROUP_NAME)

type RadioGroupElement = React.ComponentRef<typeof Primitive.div>
type RovingFocusGroupProps = React.ComponentPropsWithoutRef<typeof RovingFocusGroup.Root>
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
interface RadioGroupProps extends PrimitiveDivProps {
  name?: RadioGroupContextValue['name']
  form?: React.ComponentPropsWithoutRef<typeof Radio>['form']
  required?: React.ComponentPropsWithoutRef<typeof Radio>['required']
  disabled?: React.ComponentPropsWithoutRef<typeof Radio>['disabled']
  dir?: RovingFocusGroupProps['dir']
  orientation?: RovingFocusGroupProps['orientation']
  loop?: RovingFocusGroupProps['loop']
  defaultValue?: string
  value?: string | null
  onValueChange?: RadioGroupContextValue['onValueChange']
}

const RadioGroup = React.forwardRef<RadioGroupElement, RadioGroupProps>(
  (props: ScopedProps<RadioGroupProps>, forwardedRef) => {
    const {
      __scopeRadioGroup,
      name,
      form,
      defaultValue,
      value: valueProp,
      required = false,
      disabled = false,
      orientation,
      dir,
      loop = true,
      onValueChange,
      ...groupProps
    } = props
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeRadioGroup)
    const direction = useDirection(dir)
    const [value, setValue] = useControllableState({
      prop: valueProp,
      defaultProp: defaultValue ?? null,
      // value 는 초기/리셋 시 null 일 수 있으나 public onValueChange 는 (string) => void 계약이다.
      // null(그룹 비움) 전이는 선택-변경이 아니므로 소비자 콜백에 흘리지 않는다(타입 캐스트 대신 가드).
      onChange: (value) => {
        if (value !== null) onValueChange?.(value)
      },
      caller: RADIO_GROUP_NAME,
    })
    const [control, setControl] = React.useState<RadioGroupElement | null>(null)
    const composedRefs = useComposedRefs(forwardedRef, setControl)

    const initialValueRef = React.useRef(value)
    React.useEffect(() => {
      const associatedForm = form
        ? control?.ownerDocument.getElementById(form)
        : control?.closest('form')
      if (associatedForm instanceof HTMLFormElement) {
        const reset = () => setValue(initialValueRef.current)
        associatedForm.addEventListener('reset', reset)
        return () => associatedForm.removeEventListener('reset', reset)
      }
    }, [control, form, setValue])

    return (
      <RadioGroupProvider
        scope={__scopeRadioGroup}
        name={name}
        form={form}
        required={required}
        disabled={disabled}
        value={value}
        onValueChange={setValue}
      >
        <RovingFocusGroup.Root
          asChild
          {...rovingFocusGroupScope}
          orientation={orientation}
          dir={direction}
          loop={loop}
        >
          <Primitive.div
            role="radiogroup"
            aria-required={required}
            aria-orientation={orientation}
            data-disabled={disabled ? '' : undefined}
            dir={direction}
            {...groupProps}
            ref={composedRefs}
          />
        </RovingFocusGroup.Root>
      </RadioGroupProvider>
    )
  }
)

RadioGroup.displayName = RADIO_GROUP_NAME

/* -------------------------------------------------------------------------------------------------
 * RadioGroupItemProvider
 * -----------------------------------------------------------------------------------------------*/

const ITEM_NAME = 'RadioGroupItem'
const ITEM_PROVIDER_NAME = 'RadioGroupItemProvider'
const ITEM_TRIGGER_NAME = 'RadioGroupItemTrigger'
const ITEM_BUBBLE_INPUT_NAME = 'RadioGroupItemBubbleInput'

interface RadioGroupItemProviderProps {
  value: string
  disabled?: boolean
  children?: React.ReactNode
}

function RadioGroupItemProvider(props: ScopedProps<RadioGroupItemProviderProps>) {
  const {
    __scopeRadioGroup,
    value,
    disabled,
    children,
    // @ts-expect-error
    internal_do_not_use_render,
  } = props
  const context = useRadioGroupContext(ITEM_PROVIDER_NAME, __scopeRadioGroup)
  const radioScope = useRadioScope(__scopeRadioGroup)
  const isDisabled = context.disabled || disabled

  return (
    <RadioProvider
      {...radioScope}
      checked={context.value === value}
      disabled={isDisabled}
      required={context.required}
      name={context.name}
      form={context.form}
      value={value}
      onCheck={() => context.onValueChange(value)}
      // @ts-expect-error
      internal_do_not_use_render={internal_do_not_use_render}
    >
      {children}
    </RadioProvider>
  )
}

/* -------------------------------------------------------------------------------------------------
 * RadioGroupItemTrigger
 * -----------------------------------------------------------------------------------------------*/

type RadioGroupItemTriggerElement = React.ComponentRef<typeof RadioTrigger>
interface RadioGroupItemTriggerProps extends React.ComponentPropsWithoutRef<typeof RadioTrigger> {}

const RadioGroupItemTrigger = React.forwardRef<
  RadioGroupItemTriggerElement,
  RadioGroupItemTriggerProps
>((props: ScopedProps<RadioGroupItemTriggerProps>, forwardedRef) => {
  const { __scopeRadioGroup, ...triggerProps } = props
  const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeRadioGroup)
  const radioScope = useRadioScope(__scopeRadioGroup)
  const { checked, disabled } = useRadioContext(ITEM_TRIGGER_NAME, radioScope.__scopeRadio)
  const ref = React.useRef<RadioGroupItemTriggerElement>(null)
  const composedRefs = useComposedRefs(forwardedRef, ref)
  const isArrowKeyPressedRef = React.useRef(false)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (ARROW_KEYS.includes(event.key)) {
        isArrowKeyPressedRef.current = true
      }
    }
    const handleKeyUp = () => (isArrowKeyPressedRef.current = false)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <RovingFocusGroup.Item
      asChild
      {...rovingFocusGroupScope}
      focusable={!disabled}
      active={checked}
    >
      <RadioTrigger
        {...radioScope}
        {...triggerProps}
        ref={composedRefs}
        onKeyDown={composeEventHandlers(triggerProps.onKeyDown, (event) => {
          // According to WAI ARIA, radio groups don't activate items on enter
          // keypress
          if (event.key === 'Enter') event.preventDefault()
        })}
        onFocus={composeEventHandlers(triggerProps.onFocus, () => {
          /**
           * Our `RovingFocusGroup` will focus the radio when navigating with
           * arrow keys and we need to "check" it in that case. We click it to
           * "check" it (instead of updating `context.value`) so that the radio
           * change event fires.
           */
          if (isArrowKeyPressedRef.current) {
            ref.current?.click()
          }
        })}
      />
    </RovingFocusGroup.Item>
  )
})

RadioGroupItemTrigger.displayName = ITEM_TRIGGER_NAME

/* -------------------------------------------------------------------------------------------------
 * RadioGroupItem
 * -----------------------------------------------------------------------------------------------*/

type RadioGroupItemElement = React.ComponentRef<typeof Radio>
type RadioComponentProps = React.ComponentPropsWithoutRef<typeof Radio>
interface RadioGroupItemProps extends Omit<RadioComponentProps, 'onCheck' | 'name'> {
  value: string
}

const RadioGroupItem = React.forwardRef<RadioGroupItemElement, RadioGroupItemProps>(
  (props: ScopedProps<RadioGroupItemProps>, forwardedRef) => {
    const { __scopeRadioGroup, value, disabled, ...itemProps } = props

    return (
      <RadioGroupItemProvider
        __scopeRadioGroup={__scopeRadioGroup}
        value={value}
        disabled={disabled}
        // @ts-expect-error
        internal_do_not_use_render={({ isFormControl }: { isFormControl: boolean }) => (
          <>
            <RadioGroupItemTrigger
              {...itemProps}
              ref={forwardedRef}
              // @ts-expect-error
              __scopeRadioGroup={__scopeRadioGroup}
            />
            {isFormControl && (
              <RadioGroupItemBubbleInput
                // @ts-expect-error
                __scopeRadioGroup={__scopeRadioGroup}
              />
            )}
          </>
        )}
      />
    )
  }
)

RadioGroupItem.displayName = ITEM_NAME

/* -------------------------------------------------------------------------------------------------
 * RadioGroupItemBubbleInput
 * -----------------------------------------------------------------------------------------------*/

type RadioGroupItemBubbleInputElement = React.ComponentRef<typeof RadioBubbleInput>
interface RadioGroupItemBubbleInputProps extends React.ComponentPropsWithoutRef<
  typeof RadioBubbleInput
> {}

const RadioGroupItemBubbleInput = React.forwardRef<
  RadioGroupItemBubbleInputElement,
  RadioGroupItemBubbleInputProps
>((props: ScopedProps<RadioGroupItemBubbleInputProps>, forwardedRef) => {
  const { __scopeRadioGroup, ...bubbleProps } = props
  const radioScope = useRadioScope(__scopeRadioGroup)
  return <RadioBubbleInput {...radioScope} {...bubbleProps} ref={forwardedRef} />
})

RadioGroupItemBubbleInput.displayName = ITEM_BUBBLE_INPUT_NAME

/* -------------------------------------------------------------------------------------------------
 * RadioGroupIndicator
 * -----------------------------------------------------------------------------------------------*/

const INDICATOR_NAME = 'RadioGroupIndicator'

type RadioGroupIndicatorElement = React.ComponentRef<typeof RadioIndicator>
type RadioIndicatorPropsAlias = React.ComponentPropsWithoutRef<typeof RadioIndicator>
interface RadioGroupIndicatorProps extends RadioIndicatorPropsAlias {}

const RadioGroupIndicator = React.forwardRef<RadioGroupIndicatorElement, RadioGroupIndicatorProps>(
  (props: ScopedProps<RadioGroupIndicatorProps>, forwardedRef) => {
    const { __scopeRadioGroup, ...indicatorProps } = props
    const radioScope = useRadioScope(__scopeRadioGroup)
    return <RadioIndicator {...radioScope} {...indicatorProps} ref={forwardedRef} />
  }
)

RadioGroupIndicator.displayName = INDICATOR_NAME

/* ---------------------------------------------------------------------------------------------- */

export {
  createRadioGroupScope,
  //
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemProvider as unstable_RadioGroupItemProvider,
  RadioGroupItemTrigger as unstable_RadioGroupItemTrigger,
  RadioGroupItemBubbleInput as unstable_RadioGroupItemBubbleInput,
  RadioGroupIndicator,
  //
  RadioGroup as Root,
  RadioGroupItem as Item,
  RadioGroupItemProvider as unstable_ItemProvider,
  RadioGroupItemTrigger as unstable_ItemTrigger,
  RadioGroupItemBubbleInput as unstable_ItemBubbleInput,
  RadioGroupIndicator as Indicator,
}
export type {
  RadioGroupProps,
  RadioGroupItemProps,
  RadioGroupItemProviderProps as unstable_RadioGroupItemProviderProps,
  RadioGroupItemTriggerProps as unstable_RadioGroupItemTriggerProps,
  RadioGroupItemBubbleInputProps as unstable_RadioGroupItemBubbleInputProps,
  RadioGroupIndicatorProps,
}
