# Documentation design QA

Date: 2026-09-07

final result: passed

## Visual reference and evidence

Source visual: [Zustand demo](https://zustand-demo.pmnd.rs/). The requested direction is a strong homage with an original panda and interactive depth, adapted to comwit's documentation and one-file agent workflow.

- [Desktop comparison](qa/comparison-desktop.webp): source and implementation captured at 1440 × 960 CSS pixels, each rendered at 1440 × 960 pixels. Both are uniformly scaled to 1008 × 672 in the side-by-side comparison, without cropping.
- [Desktop home](qa/home-desktop.webp): 1440 × 960, initial Model tab, count 1, motion paused for a stable comparison.
- [Mobile home](qa/home-mobile.webp): 390 × 844 image of the approximately 390 × 844 CSS viewport, initial Model tab. The lower sections were separately checked by scrolling.
- [Desktop documentation](qa/docs-desktop.webp): Next.js guide, 1440 × 960.
- [Mobile documentation](qa/docs-mobile.webp): Quickstart, 390 × 844.

The code panel and mobile text were inspected at their original captured size, in addition to the full-view comparison. No additional cropped evidence was needed to read these details.

## Comparison history

1. **P1, hero overlap:** the first composition placed the introduction and CTA over the panda's face. Moved the introduction and CTA above the code panel on desktop and gave the mobile mascot its own space.
2. **P2, vertical overflow:** the initial demo exceeded the fixed hero height and pushed its footer beyond the background. Reduced desktop panel height and spacing. The final desktop hero and footer both end at 960px; mobile uses content-driven height.
3. **P2, document navigation:** headings previously received IDs only after hydration, and the persistent table of contents did not refresh on route changes. Generate heading IDs with rehype-slug, remount the contents per pathname, observe streamed headings, and bound the sticky contents with scrolling. Verified a direct `local#provider-setup` navigation and contents changing from Quickstart to the Next.js guide.
4. **Final comparison:** the new screenshots show clear text, a distinct panda silhouette, balanced illustration/code proportions, and no horizontal overflow at 1440px or 390px. All P1/P2 findings above are resolved.

## Required visual surfaces

- **Typography:** Manrope display headings, Inter body/UI, Geist Mono code. Fonts load correctly, headings wrap cleanly, and long code remains horizontally scrollable inside its panel.
- **Layout:** original illustration on the left, floating code and counter on the right, then short proof and documentation sections. Mobile stacks these regions and provides a collapsible documentation menu.
- **Color:** aubergine garden, charcoal code panel, lavender interactions, warm paper reading surface. Active navigation and focus states remain visible.
- **Imagery:** original ImageGen illustration and separately generated background, both 1536 × 1024 WebP. The foreground uses a registered CSS crop of the original illustration, preserving the character rather than approximating it with drawn UI shapes. Runtime assets total about 264 KB.
- **Copy:** comwit.io and 1,000+ project adoption are the product facts supplied by the maintainer. The main workflow leads to llms.txt; advanced APIs remain in linked references. The document review preserves the compact core guide while fixing actual example errors.

The original panda, extra onboarding copy, lower content sections, and layered motion are intentional adaptations of the reference, not attempts at a pixel-identical clone.

## Interaction and build validation

- Real workspace comwit counter: increment, reset, and visible panda response.
- Separate forest/foreground pointer motion and perspective code movement verified through changing rendered transforms. Ambient breathing runs, and pausing removes it and resets pointer movement.
- Model/Actions/React tabs, keyboard arrow navigation, snippet and llms.txt copy controls. The llms.txt control visibly confirms a successful clipboard write.
- Mobile documentation menu, current-page indication, route-specific contents, and direct heading links.
- Production browser console: no errors or warnings in a fresh session.
- `yarn workspace docs build`: 34 prerendered routes, TypeScript passed.
- `yarn workspace docs lint` and Prettier: passed.
- 17 MDX documents compiled and internal documentation links checked.
- Quickstart/Next.js examples extracted into 13 files and typechecked against the library.
- 125 TypeScript/TSX fences parsed; four existing, intentionally partial examples were checked in context.
- 49 existing library tests passed:

```sh
yarn workspace @comwit/state test tests/query-hydrate.test.tsx tests/query-selector-load.test.tsx tests/local.test.ts tests/streaming-query.test.ts
```

## Remaining limits

The system reduced-motion preference is handled in the component and CSS; the test browser used its normal motion preference, so that operating-system setting was not toggled during this run. The explicit pause/resume control was exercised. The scene uses layered illustration, spring transforms, and canvas particles rather than a Spline scene or a rigged 3D character.
