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

## Product marks

Navigation and landing links share `app/product-mark.tsx`:

- `public/brand/state-mark.webp`: the original winking panda with its square background removed.
- UI uses `public/brand/ui-mark-monochrome.png`: a mobile frame with a content card and bottom navigation.
- Template uses `public/brand/template-mark-monochrome.png`: the original three offset sheets and folded corner, redrawn as a monochrome outline.

The UI and Template alpha masks inherit the surrounding ink color, staying crisp at navigation sizes and reversing naturally on the landing's dark links. The State image retains its alpha channel and transparent padding; do not put it inside a colored tile or clip its silhouette with a border radius.

Only the main landing uses `public/brand/state-mark-monochrome.png` as an alpha mask for State, in both its header and product link. This flat panda inherits the same ink as the UI and Template symbols. State documentation and all other headers keep the original colored panda.

The UI and Template masks were generated with built-in ImageGen and optimized to 256 × 256 PNG while preserving alpha. Their exact prompts and references are recorded in `landing-tool-mark-prompts.json`.

The earlier generated UI and Template WebP assets remain available in `public/brand/`, with their generation prompts in `product-mark-prompts.json`, but are not used in navigation.

Mobile landing navigation keeps all three product names visible on a second header row. Product documentation uses the same mark beside the product name. Hover, pressed, and keyboard focus states belong to the link around the image.
