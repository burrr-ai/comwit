# Expressive landing and direct documentation QA

Date: 2026-09-24

## Target

The approved direction is an expressive, Awwwards-inspired Comwit landing with large typography and minimal copy. Product links must open documentation immediately. State keeps the existing panda artwork inside its documentation sidebar layout; UI starts with installation and live examples.

Research and asset provenance: [expressive landing notes](design/expressive-landing.md).

## Visual checks

- Desktop: oversized Archivo wordmark fits inside the actual content width, with no horizontal overflow. The sculpture overlaps the poster and both library links remain visible in a short desktop viewport.
- Narrow viewport (355 CSS pixels in the in-app browser): wordmark fits; artwork is deliberately cropped inside the poster; State and UI links stack with large tap targets. No horizontal scrolling.
- State desktop: persistent sidebar, panda cover, install command, counter/code example, and links into the guides. Introduction omits the redundant right-hand table of contents.
- State mobile: collapsed documentation menu, legible cover title, install command, and a horizontal counter control above the code example.
- UI desktop: persistent sidebar, installation commands and component/agent links before the live example.

## Interaction checks

- Keyboard focus on State sets the product theme; computed background reaches the State violet value.
- Pause control changes `data-moving` to false and removes the artwork animation. Reduced-motion and document-visibility handling are implemented in the same presentation subscription, with a static server fallback.
- Activating State navigates directly to `/state/docs`; activating UI navigates directly to `/ui` with its documentation menu.
- Browser console inspection after navigation returned no application errors.

## Validation

- Documentation production build passed after clearing obsolete generated types from the previous workspace layout.
- Documentation lint and TypeScript checks passed.
- Generated hero retains its alpha channel and is approximately 172 KB as WebP.
- Archivo Black is bundled for the matching social image, with its OFL license.

final result: passed
