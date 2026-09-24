# Expressive landing and direct documentation QA

Date: 2026-09-24

## Target

The approved direction is an expressive, Awwwards-inspired Comwit landing with large typography and minimal copy. Product links must open documentation immediately. State keeps the original animated panda landing inside its documentation sidebar layout; UI starts with installation and live examples.

Research and asset provenance: [expressive landing notes](design/expressive-landing.md).

## Visual checks

- Desktop: oversized Archivo wordmark fits inside the actual content width, with no horizontal overflow. The sculpture overlaps the poster and both library links remain visible in a short desktop viewport.
- Narrow viewport (355 CSS pixels in the in-app browser): wordmark fits; artwork is deliberately cropped inside the poster; State and UI links stack with large tap targets. No horizontal scrolling.
- State desktop: the original animated garden, full panda scene, floating counter, code tabs, install command and original lower-page sections are preserved beside the persistent sidebar. Introduction omits the redundant right-hand table of contents.
- State mobile: collapsed documentation menu and the original stacked panda landing with its floating counter and code panel. Full-page width equals the client width; no horizontal overflow.
- UI desktop: persistent sidebar, installation commands and component/agent links before the live example.

## Interaction checks

- Keyboard focus on State sets the product theme; computed background reaches the State violet value.
- Pause control changes `data-moving` to false and removes the artwork animation. Reduced-motion and document-visibility handling are implemented in the same presentation subscription, with a static server fallback.
- Activating State navigates directly to `/state/docs`; activating UI navigates directly to `/ui` with its documentation menu.
- Browser console inspection after navigation returned no application errors.

## Header stability

The shared header fixes height, gutters, typography, image dimensions and menu spacing. Theme-specific rules only change colors; stable scrollbar gutters prevent horizontal movement between short and long pages.

Measured bounding rectangles for header, wordmark and both product links were exactly identical across `/`, `/state/docs` and `/ui` at both desktop and narrow mobile viewports. Desktop header height: 80 CSS pixels. Mobile header height: 72 CSS pixels. The State API page uses the same geometry. The restored State counter incremented from 1 to 2 and retained its original interaction.

Opening a UI dialog initially applied duplicate scrollbar compensation (1150px header became 1136px). With stable-gutter-aware scroll-lock compensation, the header remains 1150px before and during the modal. Escape still closes the dialog normally.

## Validation

- Documentation production build passed after clearing obsolete generated types from the previous workspace layout.
- Documentation lint and TypeScript checks passed.
- Generated hero retains its alpha channel and is approximately 172 KB as WebP.
- Archivo Black is bundled for the matching social image, with its OFL license.

final result: passed
