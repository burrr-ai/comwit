'use client'

/**
 * TextField — 폼 필드 레이어. a11y·IME(id·label↔control·aria-describedby·aria-invalid)는
 * @comwit/ui TextField 프리미티브가 책임지고, 여기선 컴윗 토큰으로 시각만 입힌다.
 *
 * MUI 노치 아웃라인/플로팅 라벨 흉내는 걷어냈다 — 컴윗은 outlined 하나면 충분하다.
 * 라벨은 컨트롤 위, 컨트롤(Input/Textarea)이 옅은 보더 + 브랜드 포커스 링을 직접 그린다.
 * Root 의 isInvalid 가 프리미티브를 통해 자식에 aria-invalid 로 배선돼 invalidField 가 켜진다.
 *
 *   <TextField label="이름" helperText="실명" error={err} required>
 *     <Input value={v} onChange={(e) => setV(e.target.value)} />
 *   </TextField>
 */

import * as React from 'react'

import { TextField as TextFieldPrimitive } from '@comwit/ui'
import { cn } from '../../lib/utils'

export type TextFieldProps = {
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  disabled?: boolean
  /** 명시적 invalid. 생략 시 error 유무로 판정. */
  invalid?: boolean
  className?: string
  /** 컨트롤 — <Input /> 또는 <Textarea />. */
  children: React.ReactElement
}

function TextField({
  label,
  helperText,
  error,
  required,
  disabled,
  invalid,
  className,
  children,
}: TextFieldProps) {
  const isInvalid = invalid ?? Boolean(error)

  return (
    <TextFieldPrimitive.Root
      isInvalid={isInvalid}
      isRequired={required}
      isDisabled={disabled}
      className={cn(
        // 비활성은 컨트롤이 스스로 흐려진다 — 루트까지 흐리면 두 번 겹친다. 라벨·설명만 따로 흐린다.
        'group/field flex w-full flex-col gap-1.5',
        className
      )}
    >
      {label ? (
        <TextFieldPrimitive.Label className="text-label font-semibold text-foreground group-data-[disabled=true]/field:opacity-disabled group-data-[invalid=true]/field:text-destructive">
          {label}
          {required ? (
            <span aria-hidden="true" className="text-destructive">
              {' '}
              *
            </span>
          ) : null}
        </TextFieldPrimitive.Label>
      ) : null}

      <TextFieldPrimitive.Control>{children}</TextFieldPrimitive.Control>

      {helperText && !error ? (
        <TextFieldPrimitive.Description className="text-caption text-muted-foreground group-data-[disabled=true]/field:opacity-disabled">
          {helperText}
        </TextFieldPrimitive.Description>
      ) : null}
      {error ? (
        <TextFieldPrimitive.Error className="text-caption text-destructive">
          {error}
        </TextFieldPrimitive.Error>
      ) : null}
    </TextFieldPrimitive.Root>
  )
}

export { TextField }
