'use client'

/**
 * TextField — form-field layer. The @comwit/ui TextField primitive owns accessibility and IME behavior
 * (IDs, label/control connection, aria-describedby, aria-invalid). This layer applies Comwit visual tokens.
 *
 * No MUI-style notched outline or floating label; Comwit uses a single outlined style. The label sits above
 * the control, and Input/Textarea draws its own subtle border and brand focus ring. Root isInvalid reaches
 * the child as aria-invalid through the primitive, activating invalidField.
 *
 *   <TextField label="Name" helperText="Legal name" error={err} required>
 *     <Input value={v} onChange={(e) => setV(e.target.value)} />
 *   </TextField>
 */

import * as React from 'react'

import { TextField as TextFieldPrimitive } from '@comwit/ui'
import { cn } from '@/lib/utils/cn'

export type TextFieldProps = {
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  disabled?: boolean
  /**
   * Explicit invalid state. Defaults to whether error is present.
   */
  invalid?: boolean
  className?: string
  /**
   * Control: Input or Textarea.
   */
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
        // Disabled controls dim themselves; dimming Root too would compound opacity. Dim only labels and descriptions separately.
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
