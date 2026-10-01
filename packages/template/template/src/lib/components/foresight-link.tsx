'use client'

import NextLink from 'next/link'
import type { ComponentProps } from 'react'

/**
 * ForesightLink — `next/link` 드롭인 래퍼 (base-template 버전).
 *
 * ForesightJS(마우스 궤적 예측 prefetch)로 바꿔 끼울 수 있게 이름을 맞춘 자리다. 기본은
 * 의존성 없이 동작하도록 평범한 next/link 로 둔다. export 이름·props 가 동일하므로
 * admin `_components` 의 `import { ForesightLink as Link }` 가 그대로 resolve 된다.
 * 예측 prefetch 가 필요하면 `@foresightjs/react` 를 설치하고 이 파일만 교체하면 된다.
 */
type ForesightLinkProps = ComponentProps<typeof NextLink>

export function ForesightLink(props: ForesightLinkProps) {
  return <NextLink {...props} />
}
