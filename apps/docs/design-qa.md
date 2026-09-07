# Documentation design QA

Date: 2026-09-07

final result: passed

## Visual reference and evidence

Source visual: [Zustand demo](https://zustand-demo.pmnd.rs/). The requested direction is a strong homage with an original panda and interactive depth, adapted to comwit's documentation and one-file agent workflow.

- [Original landing comparison](qa/comparison-desktop.webp): historical source and implementation captured at 1440 × 960 CSS pixels, each rendered at 1440 × 960 pixels. Both are uniformly scaled to 1008 × 672 in the side-by-side comparison, without cropping.
- [Desktop home](qa/home-desktop.webp): 1200 × 960, initial Actions tab, count 1, motion paused for a stable comparison.
- [Mobile home](qa/home-mobile.webp): 390 × 844 image of the approximately 390 × 844 CSS viewport, initial Actions tab. The lower sections were separately checked by scrolling.
- [Desktop documentation](qa/docs-desktop.webp): Utilities with the new sidebar and panda brand, 1200 × 960.
- [Mobile documentation](qa/docs-mobile.webp): Quickstart, 390 × 844.
- [Sidebar comparison](qa/sidebar-comparison.webp): before/after Utilities navigation, each cropped to the same 320 × 960 CSS-pixel region without scaling. The complete changed sidebar and header brand are visible.
- [Open mobile sidebar](qa/sidebar-mobile.webp): 390 × 844, current Utilities link visible, search and llms.txt kept outside the scrolling list.

The code panel and mobile text were inspected at their original captured size, in addition to the full-view comparison. No additional cropped evidence was needed to read these details.

## Comparison history

1. **P1, hero overlap:** the first composition placed the introduction and CTA over the panda's face. Moved the introduction and CTA above the code panel on desktop and gave the mobile mascot its own space.
2. **P2, vertical overflow:** the initial demo exceeded the fixed hero height and pushed its footer beyond the background. Reduced desktop panel height and spacing. The final desktop hero and footer both end at 960px; mobile uses content-driven height.
3. **P2, document navigation:** headings previously received IDs only after hydration, and the persistent table of contents did not refresh on route changes. Generate heading IDs with rehype-slug, remount the contents per pathname, observe streamed headings, and bound the sticky contents with scrolling. Verified a direct `local#provider-setup` navigation and contents changing from Quickstart to the Next.js guide.
4. **Copy cleanup:** removed decorative eyebrows, version/filename/language labels, tab and section numbering, and repeated helper copy. Enlarged functional controls and code. Object actions capture `const m = state(counter)` once; the Class tab captures `private m` once and reuses it. The floating counter was raised to keep the new toolbar copy control unobstructed.
5. **Sidebar and brand:** replace the plain navigation rail with a dark aubergine surface, clear section hierarchy, Phosphor icons, a filtered page list, and a strong active state. Introduce an original panda face mark in the header/footer and matching PNG browser icons. Tightened spacing so all 17 links fit the normal 960px desktop height; a ResizeObserver keeps the current page visible when the list is shorter or the mobile menu opens.
6. **Final comparison:** the new screenshots show clear text, a distinct panda silhouette, balanced illustration/code proportions, and no horizontal overflow at 1440px or 390px. All P1/P2 findings above are resolved.

## Required visual surfaces

- **Typography:** Manrope display headings, Inter body/UI, Geist Mono code. Fonts load correctly, headings wrap cleanly, and long code remains horizontally scrollable inside its panel.
- **Layout:** original illustration on the left, floating code and counter on the right, then short proof and documentation sections. Mobile stacks these regions and provides a collapsible documentation menu. The 280px desktop sidebar keeps its search and llms.txt link fixed while its links scroll.
- **Color:** aubergine garden, charcoal code panel, lavender interactions, warm paper reading surface. Active navigation uses a light lavender fill and a warm rail marker against the dark sidebar; focus states remain visible.
- **Imagery:** original ImageGen illustration and separately generated background, both 1536 × 1024 WebP. The foreground uses a registered CSS crop of the original illustration, preserving the character rather than approximating it with drawn UI shapes. The garden assets total about 264 KB. The new panda mark is a separate ImageGen asset, resized to a 256px WebP and 32/192/180px PNG icons; it is readable in the 40px desktop and 34px mobile brand treatment.
- **Copy:** comwit.io and 1,000+ project adoption are the product facts supplied by the maintainer. The main workflow leads to llms.txt; advanced APIs remain in linked references. The document review preserves the compact core guide while fixing actual example errors.

The original panda, extra onboarding copy, lower content sections, and layered motion are intentional adaptations of the reference, not attempts at a pixel-identical clone.

## Interaction and build validation

- Real workspace comwit counter: increment, reset, and visible panda response.
- Separate forest/foreground pointer motion and perspective code movement verified through changing rendered transforms. Ambient breathing runs, and pausing removes it and resets pointer movement.
- Model/Actions/Class/React tabs, keyboard arrow navigation, snippet and llms.txt copy controls. The llms.txt control visibly confirms a successful clipboard write.
- Mobile documentation menu, current-page indication, route-specific contents, and direct heading links.
- Sidebar filtering: query match, no results, Escape clear, clear button, Enter on a single result, and menu closure after mobile navigation. Short desktop (1200 × 700) keeps both current-page selection and llms.txt reachable; no horizontal overflow.
- Browser metadata references the new 32px/192px favicons and 180px Apple icon.
- Production browser console: no errors or warnings in a fresh session.
- `yarn workspace docs build`: 34 prerendered routes, TypeScript passed.
- `yarn workspace docs lint` and Prettier: passed.
- All four landing snippets typechecked together against `@comwit/state`; the default Actions tab and the Class tab both reuse a captured state proxy.
- 17 MDX documents compiled and internal documentation links checked.
- Quickstart/Next.js examples extracted into 13 files and typechecked against the library.
- 125 TypeScript/TSX fences parsed; four existing, intentionally partial examples were checked in context.
- 49 existing library tests passed:

```sh
yarn workspace @comwit/state test tests/query-hydrate.test.tsx tests/query-selector-load.test.tsx tests/local.test.ts tests/streaming-query.test.ts
```

## Remaining limits

The system reduced-motion preference is handled in the component and CSS; the test browser used its normal motion preference, so that operating-system setting was not toggled during this run. The explicit pause/resume control was exercised. The scene uses layered illustration, spring transforms, and canvas particles rather than a Spline scene or a rigged 3D character.
