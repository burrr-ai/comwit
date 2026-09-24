import { Archivo } from 'next/font/google'
import { ExhibitionLanding } from './exhibition-landing'
import './exhibition.css'

const archivo = Archivo({
  subsets: ['latin'],
  weight: 'variable',
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
})

export default function Home() {
  return (
    <div className={archivo.variable}>
      <ExhibitionLanding />
    </div>
  )
}
