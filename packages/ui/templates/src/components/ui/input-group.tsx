import * as React from 'react'

import { focusWithinField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

/**
 * Input 을 감싸 prefix/suffix(아이콘·텍스트)를 붙이는 컨테이너.
 * 내부 Input 의 보더/포커스는 중화하고, 포커스 표시는 이 컨테이너가 받는다.
 *
 * <InputGroup>
 *   <InputAddon><SearchIcon /></InputAddon>
 *   <Input placeholder="검색" />
 * </InputGroup>
 */
function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        'flex h-10 w-full items-center rounded-md border border-input bg-transparent transition-[border-color,box-shadow]',
        focusWithinField,
        'has-[input:disabled]:opacity-disabled has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/20',
        '[&_[data-slot=input]]:h-full [&_[data-slot=input]]:flex-1 [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:focus-visible:ring-0 [&_[data-slot=input]]:focus-visible:border-transparent',
        className
      )}
      {...props}
    />
  )
}

/** InputGroup 안에서 아이콘·단위 텍스트 등 부가 요소를 담는 슬롯. */
function InputAddon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="input-addon"
      className={cn(
        'flex shrink-0 items-center gap-1 px-3 text-body-sm text-muted-foreground [&_svg]:size-4',
        className
      )}
      {...props}
    />
  )
}

export { InputGroup, InputAddon }
