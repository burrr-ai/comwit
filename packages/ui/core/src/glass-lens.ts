'use client'

/**
 * comwit-ui — headless glass lens engine.
 *
 * The edge lens of refractive glass (Glass) uses a displacement map read by SVG feDisplacementMap.
 * This hook owns support detection (Chromium browsers with reliable SVG backdrop-filter) and canvas map generation
 * at the element's size, only when that size changes. The consumer owns SVG filter markup and visual settings such as blur and saturation.
 *
 *   const lens = useGlassLens(element, { enabled: variant === 'morphing', shape: 'pill' })
 *   lens.supported  // Whether this browser can enable the lens.
 *   lens.texture    // { url, width, height, scale } — pass to feImage and feDisplacementMap scale.
 */

import * as React from 'react'

type GlassLensShape = 'pill' | 'circle' | 'panel'

type GlassLensTexture = { url: string; width: number; height: number; scale: number }

/** Enable the refractive lens only in Chromium browsers with reliable SVG backdrop-filter support. */
function useGlassLensSupport() {
  const [supported, setSupported] = React.useState(false)
  React.useEffect(() => {
    setSupported('userAgentData' in navigator)
  }, [])
  return supported
}

/** Regenerate the lens map only when dimensions change. Scrolling and movement incur no capture cost. */
function useGlassLens(
  element: HTMLElement | null,
  { enabled = true, shape = 'pill' }: { enabled?: boolean; shape?: GlassLensShape } = {}
) {
  const supported = useGlassLensSupport()
  const active = supported && enabled
  const [texture, setTexture] = React.useState<GlassLensTexture>()

  React.useEffect(() => {
    if (!active || !element) return
    const update = () => {
      const width = element.offsetWidth
      const height = element.offsetHeight
      if (width === 0 || height === 0) return
      const map = createLensMap(width, height, shape)
      const canvas = document.createElement('canvas')
      canvas.width = map.width
      canvas.height = map.height
      const context = canvas.getContext('2d')
      if (!context) return
      context.putImageData(new ImageData(map.pixels, map.width, map.height), 0, 0)
      setTexture({ url: canvas.toDataURL(), width, height, scale: map.scale })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, active, shape])

  return { supported, texture: active ? texture : undefined }
}

/** Refract the edges symmetrically; the center and pixels outside the lens stay fixed. */
function lensDisplacement(x: number, y: number, width: number, height: number, radius: number) {
  const px = x - width / 2
  const py = y - height / 2
  const qx = Math.abs(px) - (width / 2 - radius)
  const qy = Math.abs(py) - (height / 2 - radius)
  const outsideX = Math.max(qx, 0)
  const outsideY = Math.max(qy, 0)
  const cornerLength = Math.hypot(outsideX, outsideY)
  const distance = cornerLength - radius
  const rim = Math.min(radius, 18)
  if (distance >= 0 || distance <= -rim) return { x: 0, y: 0 }
  // The derivative stays below 1, so text bends without folding over itself.
  const bend = Math.sin((-distance / rim) * Math.PI) * rim * 0.3125
  return {
    x: ((Math.sign(px) * outsideX) / cornerLength) * bend,
    y: ((Math.sign(py) * outsideY) / cornerLength) * bend,
  }
}

/** A small displacement map generated from the shape alone. No page, remote image, or frame capture. */
function createLensMap(width: number, height: number, shape: GlassLensShape) {
  const radius =
    shape === 'panel' ? Math.min(16, width / 2, height / 2) : Math.min(width, height) / 2
  const ratio = Math.min(1, 256 / Math.max(width, height))
  const mapWidth = Math.max(1, Math.ceil(width * ratio))
  const mapHeight = Math.max(1, Math.ceil(height * ratio))
  const strength = Math.min(radius, 18) * 0.3125
  const pixels = new Uint8ClampedArray(mapWidth * mapHeight * 4)
  for (let y = 0; y < mapHeight; y += 1) {
    for (let x = 0; x < mapWidth; x += 1) {
      const shift = lensDisplacement(
        ((x + 0.5) * width) / mapWidth,
        ((y + 0.5) * height) / mapHeight,
        width,
        height,
        radius
      )
      const index = (y * mapWidth + x) * 4
      pixels[index] = 128 + Math.round((127 * shift.x) / strength)
      pixels[index + 1] = 128 + Math.round((127 * shift.y) / strength)
      pixels[index + 2] = 128
      pixels[index + 3] = 255
    }
  }
  return { width: mapWidth, height: mapHeight, pixels, scale: strength * 2 }
}

export { useGlassLens, useGlassLensSupport, createLensMap }
export type { GlassLensShape, GlassLensTexture }
