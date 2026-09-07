import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'

export const dynamic = 'force-static'

export async function GET() {
  // Reuse the landing illustration; render once at build time without remote assets.
  const garden = await sharp(path.join(process.cwd(), 'public/panda-garden.webp')).png().toBuffer()
  const mark = await readFile(path.join(process.cwd(), 'public/panda-icon-192.png'))
  const manrope = await readFile(path.join(process.cwd(), 'app/og/assets/Manrope-ExtraBold.ttf'))
  const manropeRegular = await readFile(
    path.join(process.cwd(), 'app/og/assets/Manrope-Regular.ttf')
  )

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#291e31',
        color: '#f9f6ed',
        fontFamily: 'Manrope',
        position: 'relative',
      }}
    >
      {/* ImageResponse renders plain image elements into the social card. */}
      {/* eslint-disable @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${garden.toString('base64')}`}
        alt=""
        width={1200}
        height={800}
        style={{ position: 'absolute', top: -110, left: 0 }}
      />
      <div
        style={{
          position: 'absolute',
          top: 42,
          left: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 36,
          fontFamily: 'Manrope',
          fontWeight: 800,
          letterSpacing: -1.5,
        }}
      >
        <img
          src={`data:image/png;base64,${mark.toString('base64')}`}
          alt=""
          width={48}
          height={48}
          style={{ borderRadius: 12 }}
        />
        <span>comwit</span>
        <span style={{ color: '#f3b47d', marginLeft: -12 }}>.</span>
      </div>
      {/* eslint-enable @next/next/no-img-element */}
      <div
        style={{
          position: 'absolute',
          left: 612,
          top: 165,
          display: 'flex',
          flexDirection: 'column',
          width: 550,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 64,
            fontFamily: 'Manrope',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: -3,
          }}
        >
          <span>A little state.</span>
          <span>A lot of</span>
          <span style={{ color: '#dfc1ed' }}>possibility.</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 28,
            fontSize: 25,
            lineHeight: 1.5,
            color: '#e2d6e6',
          }}
        >
          <span>React state for you and your agent.</span>
          <span>Just pass llms.txt.</span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 38,
          right: 48,
          display: 'flex',
          color: '#e2d6e6',
          fontSize: 21,
        }}
      >
        library.comwit.io
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Manrope', data: manropeRegular, weight: 400, style: 'normal' },
        { name: 'Manrope', data: manrope, weight: 800, style: 'normal' },
      ],
    }
  )
}
