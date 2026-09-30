import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

/** Adds PWA output to the same preflight plan; no files are written here. */
export async function planPwa({ projectRoot, skillRoot, options, startUrl, writes, review }) {
  const input = options ?? {}
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('PWA options must be an object')
  const allowed = ['name', 'shortName', 'description', 'backgroundColor', 'themeColor', 'icon']
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new Error(`PWA options: ${allowed.join(', ')}`)
  const config = {
    name: input.name ?? 'App', shortName: input.shortName ?? input.name ?? 'App',
    description: input.description ?? '', startUrl,
    backgroundColor: input.backgroundColor ?? '#ffffff', themeColor: input.themeColor ?? '#ffffff',
  }
  if (!options) review.push('Set PWA_CONFIG name/description/colors from the product brief in src/lib/pwa/config.ts')
  for (const key of ['name', 'shortName', 'description']) {
    if (typeof config[key] !== 'string' || (key !== 'description' && !config[key].trim())) {
      throw new Error(`PWA ${key} must be ${key === 'description' ? 'a string' : 'nonempty text'}`)
    }
  }
  for (const key of ['backgroundColor', 'themeColor']) {
    if (!/^#[0-9a-f]{6}$/i.test(config[key])) throw new Error(`PWA ${key} must be a six-digit hex color`)
  }

  const target = (relative) => path.join(projectRoot, relative)
  const install = (relative, content, baseline) => {
    const bytes = Buffer.from(content)
    if (!fs.existsSync(target(relative))) writes.push({ relative, content })
    else {
      const current = fs.readFileSync(target(relative))
      if (current.equals(bytes)) return
      if (baseline && current.equals(baseline)) writes.push({ relative, content })
      else review.push(`Reconcile existing PWA file: ${relative}`)
    }
  }
  install('src/lib/pwa/config.ts', `// Shared by manifest, metadata and install banner.\nexport const PWA_CONFIG = ${JSON.stringify(config, null, 2)} as const\n`)

  // Existing Serwist registration/build/cache policy stays owned by the template.
  for (const relative of ['src/app/sw.ts', 'src/app/offline/page.tsx',
    'src/lib/components/service-worker-register.tsx', 'scripts/build-service-worker.mjs']) {
    if (!fs.existsSync(target(relative))) throw new Error(`Required template PWA infrastructure is missing: ${relative}`)
  }
  const rootLayout = fs.readFileSync(target('src/app/layout.tsx'), 'utf8')
  if (!rootLayout.includes('<ServiceWorkerRegister')) review.push('Connect the existing ServiceWorkerRegister once in src/app/layout.tsx')
  const pkg = JSON.parse(fs.readFileSync(target('package.json'), 'utf8'))
  if (!pkg.scripts?.build?.includes('sw:build')) review.push('Preserve the sw:build step before next build in package.json')

  const manifest = fs.readFileSync(path.join(skillRoot, 'assets/pwa/manifest.ts'), 'utf8')
  const baseline = fs.readFileSync(path.join(skillRoot, 'assets/pwa/template-manifest.ts'))
  install('src/app/manifest.ts', manifest, baseline)
  if (fs.existsSync(target('public/manifest.webmanifest'))) {
    review.push('Resolve duplicate /manifest.webmanifest: retain one manifest source (src/app/manifest.ts or public file)')
  }

  const layoutPath = 'src/app/(app)/layout.tsx'
  const layout = fs.readFileSync(target(layoutPath), 'utf8')
  const anchor = '<AppLayout>{children}</AppLayout>'
  if (!layout.includes('PwaInstallCapture')) {
    if (layout.split(anchor).length === 2 && !/export\s+(?:const|function|async function)\s+(?:metadata|viewport|generateMetadata|generateViewport)\b/.test(layout) &&
        !/\bas\s+(?:metadata|viewport)\b/.test(layout)) {
      writes.push({ relative: layoutPath, content:
        "import { PwaInstallCapture } from '@/lib/pwa'\n" +
        "export { pwaMetadata as metadata, pwaViewport as viewport } from '@/lib/pwa'\n\n" +
        layout.replace(anchor, '<><PwaInstallCapture /><AppLayout>{children}</AppLayout></>'),
      })
    } else review.push('Merge pwaMetadata/pwaViewport and PwaInstallCapture into the existing src/app/(app)/layout.tsx')
  }

  const icons = [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable.png', 512], ['apple-icon.png', 180]]
  let sharp
  let icon
  if (input.icon !== undefined) {
    if (typeof input.icon !== 'string' || !input.icon.trim()) throw new Error('PWA icon must be a local image path')
    icon = fs.readFileSync(path.resolve(projectRoot, input.icon))
    const requireFromProject = createRequire(target('package.json'))
    // Next ships sharp; resolve its dependency without adding packages to the project.
    sharp = createRequire(requireFromProject.resolve('next/package.json'))('sharp')
    const info = await sharp(icon).metadata()
    if (!info.width || !info.height) throw new Error('PWA icon could not be decoded')
  } else review.push('Replace the generic PWA icons with the product logo before launch (public/pwa/)')

  for (const [filename, size] of icons) {
    let content = fs.readFileSync(path.join(skillRoot, 'assets/public/pwa', filename))
    if (icon) {
      // Keep the mark inside the maskable safe circle; always paint an opaque canvas.
      const inset = Math.round(size * 0.2)
      const mark = await sharp(icon).rotate().resize(size - inset * 2, size - inset * 2, { fit: 'inside' }).png().toBuffer()
      content = await sharp({ create: { width: size, height: size, channels: 4, background: config.backgroundColor } })
        .composite([{ input: mark, gravity: 'centre' }]).png().toBuffer()
    }
    install(`public/pwa/${filename}`, content)
  }
}
