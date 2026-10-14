// ─────────────────────────────────────────────────────────────────────────
// Generate all raster favicons from public/icon.svg; rerun after editing the mark.
//   node scripts/gen-icons.mjs
// Outputs in public/: favicon.ico (16/32/48), apple-touch-icon.png (180), icon-192/512.png, and icon-maskable-512.png.
// See design/brand.md for composition and colors.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const pub = new URL('../public/', import.meta.url)
const svg = readFileSync(new URL('icon.svg', pub))
// Match the full-bleed background to the lime tile so rounded corners blend into a square.
const tile = /<rect[^>]*fill="(#[0-9a-f]{6})"/i.exec(svg.toString())[1]

// Render the 64-unit mark directly at each size with librsvg to preserve small 2px dots.
const render = (size) =>
  sharp(svg, { density: (72 * size) / 64 })
    .resize(size, size)
    .png()
    .toBuffer()

// Fill the background and center the scaled mark for icons masked by iOS and Android.
async function bleed(size, scale) {
  const inner = Math.round(size * scale)
  const offset = Math.round((size - inner) / 2)
  return sharp({ create: { width: size, height: size, channels: 3, background: tile } })
    .composite([{ input: await render(inner), left: offset, top: offset }])
    .png()
    .toBuffer()
}

// PNG-backed ICO: 6-byte header, 16-byte directory entry per image, then PNG data.
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
  // Use full bleed because iOS fills transparency with black. Match the tile's mask radius to the browser-tab mark.
  'apple-touch-icon.png': await bleed(180, 1),
  'icon-192.png': await render(192),
  'icon-512.png': await render(512),
  // Keep the c. mark inside the maskable safe area: a circle with 80% diameter.
  'icon-maskable-512.png': await bleed(512, 0.8),
}
for (const [name, data] of Object.entries(out)) writeFileSync(new URL(name, pub), data)
console.log(`icons: ${Object.keys(out).join(' · ')}`)
