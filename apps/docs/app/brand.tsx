import Link from 'next/link'

export function Brand() {
  return (
    <Link href="/" className="wordmark brand" aria-label="Comwit home">
      comwit<span className="brand-dot">.</span>
    </Link>
  )
}
