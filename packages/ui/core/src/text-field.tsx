'use client'

/**
 * comwit-ui — text-field 프리미티브 (라딕스식 compound 컴포넌트 = MUI TextField 대응, 스타일 0 · 앱 비의존).
 *
 * 텍스트 입력 필드의 **접근성(a11y) + IME + 포커스 상태**를 프리미티브가 전적으로 책임진다.
 * (소비 레이어 lib/components/ui 는 a11y 를 신경 쓰지 않는다 — cva/tailwind 스타일만.)
 *  - a11y 배선(id·label↔control·aria-describedby·aria-invalid)은 **React Aria `useField`** 로 위임.
 *    (검증된 ARIA — 자체 구현하지 않는다. radix primitives 엔 범용 text-field 가 없어 RA 를 엔진으로.)
 *  - 그 위에 **한글 IME(composition)** 와 **focus** 상태를 얹어 data-* 로 방출.
 *  - "값 있음(filled)" 은 CSS `:placeholder-shown` 이 더 견고(오토필·초기값)해서 소비 CSS 에 맡긴다.
 *
 *   <TextField.Root isInvalid isRequired>
 *     <TextField.Label>이름</TextField.Label>
 *     <TextField.Control><input /></TextField.Control>
 *     <TextField.Description>도움말</TextField.Description>
 *     <TextField.Error>필수입니다</TextField.Error>
 *   </TextField.Root>
 *
 * Root 가 방출하는 data-* (소비 CSS 훅): data-focused / data-invalid / data-disabled / data-composing.
 */

import * as React from 'react'
import { useField as useAriaField } from '@react-aria/label'
import { Slot } from './slot'
import { useLayoutEffect } from './internal/use-layout-effect'

type Aria = ReturnType<typeof useAriaField>

// 핸들러 이벤트 타깃은 HTMLElement 로 넓혀 Slot(HTMLElement 기준)과 호환.
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
  /** Description/Error 파트가 마운트 시 존재를 등록(반환값 = 해제). Root 의 존재 판정 참고. */
  registerDescription: () => () => void
  registerError: () => () => void
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

function useFieldContext(part: string): FieldContextValue {
  const ctx = React.useContext(FieldContext)
  if (!ctx) {
    throw new Error(`comwit-ui: <TextField.${part}> 는 <TextField.Root> 안에서만 쓸 수 있습니다.`)
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
  // Description/Error 존재 여부 — 두 소스의 합집합으로 판정한다.
  //  1) 직속 자식 스캔: SSR 마크업에서도 결정론적(하이드레이션 불일치 없음) — 문서화된 기본 조합을 커버.
  //  2) 마운트 등록: 파트가 레이아웃 요소로 감싸져 직속 자식이 아니어도(<Root><div><Description/></div></Root>)
  //     layout effect 로 자신을 등록해 aria-describedby 연결이 조용히 끊기지 않는다(SSR 엔 영향 없음 —
  //     하이드레이션 후 보강. 스크린리더는 라이브 DOM 을 읽으므로 a11y 손실 없음).
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

  // React Aria: id 생성 + label↔control 연결 + aria-describedby(설명+에러) 취합.
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

/* ── Control (Slot: 자식 input/textarea 에 a11y·IME 머지) ─────────── */

function Control({ children }: { children: React.ReactElement }) {
  const ctx = useFieldContext('Control')
  // Slot 이 우리 핸들러(controlProps)와 자식(consumer)의 핸들러를 자동 합성한다.
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
  // 직속 자식이 아니어도(레이아웃 래핑) Root 가 존재를 알 수 있게 마운트 등록.
  useLayoutEffect(() => registerDescription(), [registerDescription])
  const Comp = asChild ? Slot : 'p'
  return <Comp data-slot="field-description" {...descriptionProps} {...props} />
}

type ErrorProps = React.ComponentProps<'p'> & { asChild?: boolean }

function ErrorMessage({ asChild, ...props }: ErrorProps) {
  const { errorProps, registerError } = useFieldContext('Error')
  // 직속 자식이 아니어도(레이아웃 래핑) Root 가 존재를 알 수 있게 마운트 등록.
  useLayoutEffect(() => registerError(), [registerError])
  const Comp = asChild ? Slot : 'p'
  return <Comp data-slot="field-error" {...errorProps} {...props} />
}

/* ── NotchedOutline (MUI `NotchedOutline` 대응) ────────────────────────
   outlined 스타일의 **"진짜 노치"** 를 구조로 제공한다 — 배경색으로 보더를 덮는 게 아니라
   윗 보더선 일부를 실제로 안 그린다. 그래서 바탕이 흰색이 아니어도(회색 면·카드·그라디언트·
   이미지) 안전하다.
     - <fieldset> : 보더를 그리는 오버레이. 인풋 위에 얹어 소비 스킨이 색/링/radius 를 입힌다.
     - <legend>   : fieldset 첫 자식이면 **윗 보더선을 뚫고** 자리 잡는 HTML 기본 동작을 이용.
                    legend 가 차지한 폭만큼 윗선이 안 그려짐 = 노치 갭.
     - notch 사본 : legend 안에 떠오른 라벨과 **같은 노드**를 (안 보이게) 넣어 두면, 갭 폭이
                    라벨 폭과 자동으로 일치한다(측정·JS 불필요).
   스크린리더는 실제 <Label> 만 읽어야 하므로 전체 aria-hidden. **스타일 0** — 색/치수/트랜지션은
   소비 스킨이 className(fieldset) · notchClassName(legend) 으로 입힌다.

   레이아웃 계약: 소비처에서 인풋(peer) → …  → <NotchedOutline> 순으로 두면, 스킨이
   `peer-focus:[&>legend]:…` 같은 선택자로 노치 개폐를 라벨 float 와 동일 트리거로 묶을 수 있다. */
type NotchedOutlineProps = Omit<React.ComponentProps<'fieldset'>, 'children'> & {
  /** legend 에 폭 확보용으로 렌더될 라벨 사본(보이지 않음). 떠오른 Label 과 동일 노드를 전달. */
  notch?: React.ReactNode
  /** legend 에 걸 클래스(노치 갭 접힘/열림 트랜지션 등) */
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
