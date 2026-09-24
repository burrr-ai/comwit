import * as React from 'react'

import { Input as InputPrimitive } from '@comwit/ui'
import { focusField, invalidField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

// a11y·IME(한글 조합) 는 comwit-ui `Input` 프리미티브가 책임진다(data-composing 방출 · asChild · ref 전달).
// 여기서는 우리 토큰 + 인터랙션 클래스로 **시각만** 입힌다. public API 는 네이티브 input 그대로.
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base md:text-sm placeholder:text-placeholder selection:bg-primary selection:text-primary-foreground transition-[border-color,box-shadow]',
        focusField,
        invalidField,
        'disabled:cursor-not-allowed disabled:text-disabled-foreground',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        className
      )}
      {...props}
    />
  )
}

export { Input }
