import Image from 'next/image'

export type Product = 'state' | 'ui' | 'template'

export const products = {
  state: { href: '/state/docs', label: 'State' },
  ui: { href: '/ui', label: 'UI' },
  template: { href: '/template', label: 'Template' },
} satisfies Record<Product, { href: string; label: string }>

/** Shared artwork keeps each product recognizable in navigation and on the landing. */
export function ProductMark({ product, size = 32 }: { product: Product; size?: number }) {
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
