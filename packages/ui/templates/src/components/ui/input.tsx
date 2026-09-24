import * as React from 'react'

import { Input as InputPrimitive } from '@comwit/ui'
import { disabledStyle, focusField, invalidField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

/** 필드 스킨 — 높이·보더·반경·좌우 패딩. `bare` 는 이걸 안 받는다. */
const fieldSkin = 'h-9 rounded-control border border-input px-3'

// a11y·한글 IME(조합)는 @comwit/ui Input 프리미티브가 책임진다(data-composing 방출·asChild·ref 전달).
// 여기선 컴윗 토큰으로 시각만 입힌다. public API 는 네이티브 input 그대로.
function Input({
  className,
  type,
  bare = false,
  ...props
}: React.ComponentProps<'input'> & {
  /**
   * 필드 스킨(높이·보더·반경·패딩)과 포커스 링을 벗는다.
   * 이미 스타일된 컨테이너(팝오버 검색줄·pill 안 인라인 편집·제목 입력) 안에 눕는
   * 인풋용 — 스킨을 얹으면 없던 테두리·높이가 생기고 링이 이중으로 뜬다.
   * 벗어도 IME 조합 처리·선택 색·invalid·disabled 는 그대로 얻는다.
   */
  bare?: boolean
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'w-full min-w-0 bg-transparent text-body-sm placeholder:text-subtle-foreground selection:bg-primary selection:text-primary-foreground transition-[border-color,box-shadow]',
        !bare && fieldSkin,
        !bare && focusField,
        invalidField,
        disabledStyle,
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-body-sm file:font-semibold file:text-foreground',
        className
      )}
      {...props}
    />
  )
}

export { Input }
