// ─────────────────────────────────────────────────────────────────────────
// 파비콘 세트 — public/icon.svg 하나에서 래스터를 전부 뽑는다. 마크를 고치면 다시 돌린다.
//   node scripts/gen-icons.mjs
// 산출(public/): favicon.ico(16·32·48) · apple-touch-icon.png(180) · icon-192/512.png · icon-maskable-512.png
// 구성과 색은 design/brand.md.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const pub = new URL('../public/', import.meta.url)
const svg = readFileSync(new URL('icon.svg', pub))
// 풀블리드 배경은 타일과 같은 라임 — 둥근 모서리가 배경에 묻혀 사각형이 된다.
const tile = /<rect[^>]*fill="(#[0-9a-f]{6})"/i.exec(svg.toString())[1]

// 64 그리드 마크를 size px 로. 작은 크기도 librsvg 가 직접 그려야 2px 점이 뭉개지지 않는다.
const render = (size) =>
  sharp(svg, { density: (72 * size) / 64 })
    .resize(size, size)
    .png()
    .toBuffer()

// iOS·Android 가 자기 모양으로 자르는 아이콘 — 배경을 채우고 마크를 scale 만큼 가운데에.
async function bleed(size, scale) {
  const inner = Math.round(size * scale)
  const offset = Math.round((size - inner) / 2)
  return sharp({ create: { width: size, height: size, channels: 3, background: tile } })
    .composite([{ input: await render(inner), left: offset, top: offset }])
    .png()
    .toBuffer()
}

// PNG 를 그대로 담은 ICO — 헤더 6바이트 + 항목당 16바이트 디렉터리 + PNG 들.
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  const dir = Buffer.alloc(16 * images.length)
  let offset = header.length + dir.length
  images.forEach(({ size, data }, i) => {
    dir.writeUInt8(size, i * 16)
    dir.writeUInt8(size, i * 16 + 1)
    dir.writeUInt16LE(1, i * 16 + 4)
    dir.writeUInt16LE(32, i * 16 + 6)
    dir.writeUInt32LE(data.length, i * 16 + 8)
    dir.writeUInt32LE(offset, i * 16 + 12)
    offset += data.length
  })
  return Buffer.concat([header, dir, ...images.map((image) => image.data)])
}

const out = {
  'favicon.ico': ico(
    await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await render(size) })))
  ),
  // iOS 는 투명을 검정으로 채운다 — 풀블리드. 마스크 반경이 타일과 같아 브라우저 탭과 같은 모양이 된다.
  'apple-touch-icon.png': await bleed(180, 1),
  'icon-192.png': await render(192),
  'icon-512.png': await render(512),
  // maskable 안전 영역(지름 80% 원) 안에 "c." 가 들어오도록 줄인다.
  'icon-maskable-512.png': await bleed(512, 0.8),
}
for (const [name, data] of Object.entries(out)) writeFileSync(new URL(name, pub), data)
console.log(`icons: ${Object.keys(out).join(' · ')}`)
