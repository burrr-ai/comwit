'use client'

/**
 * comwit-ui — 유리 렌즈 엔진 (헤드리스).
 *
 * 굴절 유리(`Glass`)의 가장자리 렌즈는 SVG `feDisplacementMap` 이 읽는 **변위 맵**으로 만든다.
 * 이 훅이 그 JS 를 소유한다: 지원 감지(SVG backdrop-filter 가 안정적인 Chromium 계열) · 요소 크기에 맞춘
 * 변위 맵 생성(캔버스 · 크기가 바뀔 때만) . SVG 필터 마크업과 시각 파라미터(블러·채도)는 소비 레이어가 갖는다.
 *
 *   const lens = useGlassLens(element, { enabled: variant === 'morphing', shape: 'pill' })
 *   lens.supported  // 렌즈를 켤 수 있는 브라우저인가
 *   lens.texture    // { url, width, height, scale } — feImage 와 feDisplacementMap scale 에 넣는다
 */

import * as React from 'react'

type GlassLensShape = 'pill' | 'circle' | 'panel'

type GlassLensTexture = { url: string; width: number; height: number; scale: number }

/** SVG backdrop-filter 가 안정적으로 동작하는 Chromium 계열에서만 굴절 렌즈를 켠다. */
function useGlassLensSupport() {
  const [supported, setSupported] = React.useState(false)
  React.useEffect(() => {
    setSupported('userAgentData' in navigator)
  }, [])
  return supported
}

/** 크기가 바뀔 때만 렌즈 맵을 다시 만든다. 스크롤·이동에는 캡처 비용이 없다. */
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

/** 가장자리만 대칭으로 굴절시킨다 — 중앙과 렌즈 밖 픽셀은 고정. */
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
  // 도함수가 1 미만이라 글자가 접히지 않고 휘기만 한다.
  const bend = Math.sin((-distance / rim) * Math.PI) * rim * 0.3125
  return {
    x: ((Math.sign(px) * outsideX) / cornerLength) * bend,
    y: ((Math.sign(py) * outsideY) / cornerLength) * bend,
  }
}

/** 모양만으로 만드는 작은 변위 맵. 페이지 캡처·원격 이미지·프레임 캡처 없음. */
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
