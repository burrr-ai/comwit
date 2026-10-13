'use client'

import NextLink from 'next/link'
import type { ComponentProps } from 'react'

/**
 * ForesightLink: a drop-in next/link wrapper for the base template.
 *
 * This slot can use ForesightJS for pointer-predicted prefetching. It defaults to
 * plain next/link without extra dependencies. Identical exports and props preserve
 * the admin _components import { ForesightLink as Link }.
 * Install @foresightjs/react and replace this file for predictive prefetching.
 */
type ForesightLinkProps = ComponentProps<typeof NextLink>

export function ForesightLink(props: ForesightLinkProps) {
  return <NextLink {...props} />
}
