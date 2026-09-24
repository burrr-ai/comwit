import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-static'
export async function GET() {
  const font = await readFile(path.join(process.cwd(), 'app/og/assets/Manrope-ExtraBold.ttf'))
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#faf9f6',
        color: '#242422',
        padding: '80px',
        fontFamily: 'Manrope',
      }}
    >
      <div style={{ display: 'flex', fontSize: 160, fontWeight: 800, letterSpacing: -12 }}>
        comwit<span style={{ color: '#4263d4' }}>.</span>
      </div>
      <div style={{ display: 'flex', fontSize: 28, marginTop: 25 }}>
        State & UI. The building blocks behind comwit.io.
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Manrope', data: font, style: 'normal', weight: 800 }],
    }
  )
}
