import Image from 'next/image'
import type { CSSProperties } from 'react'

export type Product = 'state' | 'ui' | 'template'

export const products = {
  state: { href: '/state/docs', label: 'State' },
  ui: { href: '/ui', label: 'UI' },
  template: { href: '/template', label: 'Template' },
} satisfies Record<Product, { href: string; label: string }>

/** State keeps its colored mascot outside the landing; all other marks inherit ink. */
export function ProductMark({
  product,
  size = 32,
  monochrome = false,
}: {
  product: Product
  size?: number
  monochrome?: boolean
}) {
  if (monochrome || product !== 'state') {
    return (
      <span
        className={`product-mark product-mark-monochrome product-mark-${product}`}
        style={
          {
            '--product-mark-size': `${size}px`,
            '--product-mark-image': `url('/brand/${product}-mark-monochrome.png')`,
          } as CSSProperties
        }
        aria-hidden="true"
      />
    )
  }

  return (
    <Image
      className="product-mark"
      src={`/brand/${product}-mark.webp`}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
    />
  )
}
