import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const dynamic = 'force-static'
export async function GET() {
  const font = await readFile(path.join(process.cwd(), 'app/og/assets/ArchivoBlack-Regular.ttf'))
  const art = await sharp(path.join(process.cwd(), 'public/art/comwit-play-sculpture.webp'))
    .resize(1000)
    .png()
    .toBuffer()
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#dcfa54',
        color: '#171b12',
        padding: '42px 50px',
        fontFamily: 'Archivo',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', fontSize: 15, letterSpacing: 2 }}>
        OPEN SOURCE. OPEN ENDED.
      </div>
      <div style={{ display: 'flex', fontSize: 194, letterSpacing: -14, marginTop: 25 }}>
        COMWIT
      </div>
      {/* This image is embedded in the generated social card. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${art.toString('base64')}`}
        alt=""
        width={800}
        height={533}
        style={{ position: 'absolute', top: 135, right: -25 }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 42,
          fontSize: 32,
          letterSpacing: -1,
        }}
      >
        <span>Small pieces.</span>
        <span>Wild possibilities.</span>
      </div>
      <div style={{ display: 'flex', position: 'absolute', bottom: 40, left: 50, fontSize: 19 }}>
        State + UI / comwit.io
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Archivo', data: font, style: 'normal', weight: 400 }],
    }
  )
}
