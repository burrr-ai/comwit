# Comwit mark and favicon

## Mark

The mark is `c.`: the first letter and the dot of the `comwit.` wordmark in the header, on the landing's lime paper. When the tab and the header both show the logo, people see the same letters and the same blue dot. The lime ties the tab back to the landing and the social card.

| Role   | Value     | Where it comes from                      |
| ------ | --------- | ---------------------------------------- |
| Tile   | `#dcfa54` | `--poster-paper` on the landing, OG card |
| Letter | `#171b12` | `--poster-ink`                           |
| Dot    | `#4263d4` | `.brand-dot` in the header wordmark      |

The ink-on-lime tile stays readable on light and dark browser tab bars. An ink tile disappears against dark tab strips.

## Construction

- 64-unit grid. The tile corner radius is 14 units, close to the iOS icon mask, so the tab icon and the home-screen icon have the same shape.
- The letters are Manrope ExtraBold outlines (`app/og/assets/Manrope-ExtraBold.ttf`), the same face and weight as the header wordmark. The SVG has no text, so it doesn't depend on the viewer's fonts.
- The dot spacing uses the header's tracking (−1.8px at 28px).
- The period is exactly 8 × 8 units at x 44, baseline 48. At 16px it covers whole 2 × 2 pixels, and at 32px whole 4 × 4 pixels. That keeps the dot sharp at tab sizes instead of blurring into the lime.

## Files

| File (`public/`)                                              | Use                                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `icon.svg`                                                    | Source of truth; the favicon in modern browsers                                  |
| `favicon.ico`                                                 | 16/32/48 fallback, also served for bare `/favicon.ico` requests                  |
| `apple-touch-icon.png`                                        | 180px, full bleed (iOS fills transparency with black)                            |
| `icon-192.png`, `icon-512.png`                                | Web manifest, rounded tile                                                       |
| `icon-maskable-512.png`                                       | Web manifest, full bleed, mark inside the 80% safe circle                        |
| `brand/comwit-wordmark.svg`, `brand/comwit-wordmark-dark.svg` | Outlined `comwit.` for light and dark backgrounds, used by the repository README |

After you edit `icon.svg`, run `node scripts/gen-icons.mjs` from `apps/docs` to regenerate every raster.

State keeps its panda favicon (`app/state/layout.tsx`). UI and every other route use the Comwit mark.
