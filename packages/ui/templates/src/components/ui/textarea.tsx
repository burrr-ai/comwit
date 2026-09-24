import * as React from 'react'

import { Textarea as TextareaPrimitive } from '@comwit/ui'
import { disabledStyle, focusField, invalidField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

/** 필드 스킨 — 최소높이·자동증가·보더·반경·패딩. `bare` 는 이걸 안 받는다. */
const fieldSkin = 'field-sizing-content min-h-24 rounded-control border border-input px-3 py-2'

// a11y·한글 IME 는 @comwit/ui Textarea 프리미티브가 책임진다. 여기선 컴윗 토큰으로 시각만.
function Textarea({
  className,
  bare = false,
  ...props
}: React.ComponentProps<'textarea'> & {
  /**
   * 필드 스킨(최소높이·자동증가·보더·반경·패딩)과 포커스 링을 벗는다.
   * `rows` 로 높이를 정하거나 직접 높이를 계산하는 컴포저용 — 스킨을 얹으면
   * `min-h-24`(96px)가 `rows` 를 무시하고 `field-sizing-content` 가 수동
   * 리사이즈와 싸운다. 벗어도 IME 조합 처리·선택 색·invalid·disabled 는 얻는다.
   */
  bare?: boolean
}) {
  return (
    <TextareaPrimitive
      data-slot="textarea"
      className={cn(
        'flex w-full bg-transparent text-body-sm placeholder:text-subtle-foreground selection:bg-primary selection:text-primary-foreground transition-[border-color,box-shadow]',
        !bare && fieldSkin,
        !bare && focusField,
        invalidField,
        disabledStyle,
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
