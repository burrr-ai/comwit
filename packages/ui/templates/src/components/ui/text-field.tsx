'use client'

/**
 * TextField — 폼 필드 스타일 레이어. **a11y·IME 는 comwit-ui `TextField` 프리미티브가 책임**지고,
 * 여기서는 우리 토큰 + variant 로 **시각/트랜지션만** 입힌다.
 *
 * variant (MUI TextField 모티브):
 *  - outlined (기본) : 보더 박스 + 라벨이 상단 보더선으로 떠오름(bg 로 보더 덮어 노치).
 *  - filled          : rounded-top 회색 필 + 하단 보더. 라벨은 필 내부 상단으로.
 *  - standard        : 언더라인만. 밑줄이 중앙에서 scale-x 로 자라남.
 *  - stacked         : 라벨을 인풋 위에 고정(플로팅 아님). 좁은 폼/어드민용.
 *
 *   <TextField label="이름" description="실명" error={err} required variant="filled">
 *     <Input value={v} onChange={e => setV(e.target.value)} />
 *   </TextField>
 */

import * as React from 'react'
import { cva } from 'class-variance-authority'
import { TextField as TextFieldPrimitive } from '@comwit/ui'
import { cn } from '../../lib/utils'
import { Textarea } from './textarea'

type FieldVariant = 'outlined' | 'filled' | 'standard' | 'stacked'

export type TextFieldProps = {
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  variant?: FieldVariant
  required?: boolean
  disabled?: boolean
  /** 명시적 invalid. 생략 시 error 유무로 판정 */
  invalid?: boolean
  className?: string
  /** 컨트롤 — <Input /> 또는 <Textarea /> */
  children: React.ReactElement
}

/* ── 플로팅 variant 의 chrome 박스(보더/필/언더라인) ─────────────────
   상태색은 프리미티브가 방출한 data-*(group/field) 로 전환. 트랜지션 꼼꼼히. */
const boxVariants = cva(
  'relative flex w-full transition-[color,border-color,box-shadow,background-color] duration-base',
  {
    variants: {
      variant: {
        // outlined: 보더/링/노치는 아래 NotchedOutline(fieldset 오버레이)이 담당 → 컨테이너는 위치·사이즈만
        outlined: '',
        // 하단 보더는 항상 2px 로 두고 색만 전환 → 포커스 시 레이아웃 시프트 없음
        filled:
          'rounded-t-md border-b-2 border-input bg-muted hover:bg-accent/40 group-data-[focused=true]/field:border-ring group-data-[invalid=true]/field:border-destructive',
        // 언더라인: 정적 1px + after 오버레이가 중앙에서 scale-x 로 자라남(MUI 트랜지션)
        standard:
          'border-b border-input after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-center after:scale-x-0 after:bg-ring after:transition-transform after:duration-base group-data-[focused=true]/field:after:scale-x-100 group-data-[invalid=true]/field:border-destructive group-data-[invalid=true]/field:after:scale-x-100 group-data-[invalid=true]/field:after:bg-destructive',
        stacked: '',
      },
    },
  }
)

/* ── outlined 전용 노치 보더(comwit-ui NotchedOutline 스킨) ────────────
   fieldset 오버레이가 보더·링·invalid 를, legend 가 "진짜 노치"(윗선 뚫기)를 담당.
   배경 채우기가 없으므로 어떤 바탕색 위에서도 흰 패치가 생기지 않는다. */
const outlineClass = cn(
  // fieldset 기본값 리셋(margin/min-inline-size) + 인풋을 덮는 오버레이. px 로 노치 시작점을 코너에서 띄움.
  'pointer-events-none absolute inset-0 m-0 min-w-0 rounded-md border border-input px-2 text-left',
  'transition-[color,border-color] duration-base',
  // 포커스: box-shadow 링은 금지 — 링은 노치를 무시하고 fieldset 사각형 둘레 전체에 선을 그려서
  // 투명해진 라벨(노치 자리) 뒤로 윗선이 지나가 버린다. MUI outlined 처럼 fieldset 보더를 2px 로 강조하면
  // 노치(legend)가 그 보더도 함께 자르므로 라벨 아래 선이 안 생긴다. (오버레이라 인풋 레이아웃 시프트 없음)
  'group-data-[focused=true]/field:border-[length:var(--border-width-strong)] group-data-[focused=true]/field:border-ring',
  // invalid: 보더 destructive (포커스와 겹치면 소스 순서상 destructive 우선 → 2px destructive).
  'group-data-[invalid=true]/field:border-destructive',
  // 노치 개폐: 라벨 float 와 동일 트리거(focus || 값 있음). 인풋(peer) 뒤 형제인 fieldset 을 통해 legend 도달.
  'peer-focus:[&>legend]:max-w-full',
  'peer-[:not(:placeholder-shown)]:[&>legend]:max-w-full'
)

// legend(노치 갭) — 접힘(max-w-0)이 기본, 트리거 시 열림. text-xs 로 떠오른 라벨과 폭 일치.
const notchClass = cn(
  'invisible block h-[0.6875rem] w-auto max-w-[0.01px] overflow-hidden whitespace-nowrap p-0',
  'text-xs transition-[max-width] duration-fast ease-standard',
  '[&>span]:inline-block [&>span]:px-1'
)

/* ── 컨트롤(input/textarea) — 박스가 chrome 을 담당하므로 자식의 보더/링을 중화 + variant 패딩 ── */
function controlClass(variant: FieldVariant, isTextarea: boolean): string {
  if (variant === 'stacked') return ''
  const neutralize =
    'peer border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent aria-invalid:border-transparent aria-invalid:ring-0 placeholder:opacity-0 focus:placeholder:opacity-100'
  const pad: Record<Exclude<FieldVariant, 'stacked'>, string> = {
    // outlined 한 줄 인풋은 세로 중앙 정렬이라, 폰트 descent(디센더) 여백 탓에 한글이 위로 쏠려 보인다.
    // 위 패딩(pt-1)을 줘 값 시작점을 살짝 아래로 내려 한글을 시각적 중앙에 맞춘다. ↓ 조절 시 pt 값만.
    outlined: isTextarea ? 'min-h-24 px-3 pt-6 pb-2' : 'h-14 px-3 pt-1',
    filled: isTextarea ? 'min-h-24 px-3 pt-6 pb-2' : 'h-14 px-3 pt-5 pb-1',
    standard: isTextarea ? 'min-h-20 px-0 pt-6 pb-1' : 'h-12 px-0 pt-4 pb-1',
  }
  return cn(neutralize, pad[variant])
}

/* ── 플로팅 라벨 — 포커스(peer-focus) 또는 값 있음(:not(:placeholder-shown)) 이면 떠오름 ──
   filled 판정을 CSS 로 → 오토필·초기값도 견고. 위치/크기/색 전부 transition-all. */
const labelVariants = cva(
  'pointer-events-none absolute z-raised origin-left select-none text-base text-muted-foreground transition-all duration-base ease-standard md:text-sm motion-reduce:transition-none group-data-[disabled=true]/field:text-disabled-foreground group-data-[invalid=true]/field:text-destructive-surface-foreground peer-focus:text-ring',
  {
    variants: {
      variant: {
        outlined: cn(
          'left-3 top-1/2 -translate-y-1/2',
          // 떠오르면 라벨 세로 중앙이 상단 보더선 위에 정확히 얹히도록(=선이 글자 가운데를 지남).
          // top-0(라벨 중심이 보더보다 위) 대신 top-1.5(≈6px 아래로): 글자 광학 중심을 보더선에 맞춘다.
          // 보더는 NotchedOutline legend 가 실제로 뚫으므로 bg 채우기 없음.
          'peer-focus:top-1.5 peer-focus:-translate-y-1/2 peer-focus:text-xs',
          'peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs'
        ),
        filled: cn(
          'left-3 top-1/2 -translate-y-1/2',
          'peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs',
          'peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs'
        ),
        standard: cn(
          'left-0 top-1/2 -translate-y-1/2',
          'peer-focus:top-0 peer-focus:-translate-y-4 peer-focus:text-xs',
          'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:text-xs'
        ),
        stacked: 'static translate-y-0',
      },
    },
  }
)

const stackedLabelClass =
  'text-caption font-medium text-muted-foreground group-data-[disabled=true]/field:text-disabled-foreground group-data-[invalid=true]/field:text-destructive-surface-foreground'

const requiredMark = (required?: boolean) =>
  required ? (
    <span aria-hidden="true" className="text-destructive-surface-foreground">
      {' '}
      *
    </span>
  ) : null

function TextField({
  label,
  description,
  error,
  variant = 'outlined',
  required,
  disabled,
  invalid,
  className,
  children,
}: TextFieldProps) {
  const isInvalid = invalid ?? Boolean(error)
  const isTextarea = children.type === Textarea
  const stacked = variant === 'stacked'

  const childProps = children.props as { className?: string; placeholder?: string }
  const control = (
    <TextFieldPrimitive.Control>
      {stacked
        ? children
        : React.cloneElement(children, {
            className: cn(childProps.className, controlClass(variant, isTextarea)),
            // :placeholder-shown 으로 filled 판정하므로 placeholder 가 반드시 있어야 한다(없으면 공백).
            placeholder: childProps.placeholder ?? ' ',
          } as React.Attributes)}
    </TextFieldPrimitive.Control>
  )

  const labelNode = label ? (
    <TextFieldPrimitive.Label className={stacked ? stackedLabelClass : labelVariants({ variant })}>
      {label}
      {requiredMark(required)}
    </TextFieldPrimitive.Label>
  ) : null

  return (
    <TextFieldPrimitive.Root
      isInvalid={isInvalid}
      isRequired={required}
      isDisabled={disabled}
      data-variant={variant}
      className={cn(
        'group/field flex w-full flex-col',
        stacked ? 'gap-1.5' : 'gap-1.5',
        disabled && 'text-disabled-foreground',
        className
      )}
    >
      {stacked ? (
        <>
          {labelNode}
          {control}
        </>
      ) : (
        // 플로팅: chrome 박스가 input + 떠오르는 라벨을 감싼다(설명/에러는 박스 밖 아래).
        // outlined 는 보더/노치를 NotchedOutline(fieldset 오버레이)이 담당. 인풋(peer) → 라벨 → 아웃라인 순서 유지.
        <div className={boxVariants({ variant })}>
          {control}
          {labelNode}
          {variant === 'outlined' ? (
            <TextFieldPrimitive.NotchedOutline
              notch={
                <>
                  {label}
                  {requiredMark(required)}
                </>
              }
              className={outlineClass}
              notchClassName={notchClass}
            />
          ) : null}
        </div>
      )}

      {description && !error ? (
        <TextFieldPrimitive.Description className="text-caption text-muted-foreground group-data-[disabled=true]/field:text-disabled-foreground">
          {description}
        </TextFieldPrimitive.Description>
      ) : null}
      {error ? (
        <TextFieldPrimitive.Error className="text-caption text-destructive-surface-foreground">
          {error}
        </TextFieldPrimitive.Error>
      ) : null}
    </TextFieldPrimitive.Root>
  )
}

export { TextField }
export type { FieldVariant }
