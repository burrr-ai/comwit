import Image from 'next/image'
import Link from 'next/link'

export function Brand() {
  return (
    <Link href="/" className="wordmark brand" aria-label="comwit home">
      <Image src="/panda-mark.webp" alt="" width={40} height={40} className="brand-mark" />
      <span className="brand-name">
        comwit<span className="brand-dot">.</span>
      </span>
    </Link>
  )
}
