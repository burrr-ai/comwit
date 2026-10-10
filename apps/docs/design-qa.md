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

## Icon gallery and motion — 2026-10-10

- The gallery uses a plain title, search, controls, and readable icon names. Eyebrows, specification ribbons, repeated instructions, decorative badges, card captions, and the promotional footer are omitted. The documentation design rule is recorded in `README.md`.
- Motion was rebuilt on springs (2026-10-10, second pass). The first pass animated 0.6–1 grid unit with one cubic-bezier everywhere and erased then redrew primary strokes, so arrows barely moved and checks, chevrons and the send plane vanished mid-play. Each part is now pushed toward a pose and released through a frame-integrated spring that keeps its velocity, overshoots and settles; travel is 2–3 grid units, turns 10–25° (or a symmetric tooth/quarter turn), scale 1.08–1.2. Write-on is kept only for meaning-making ink (check marks, document lines, a git branch).
- 109 icons and 212 tracks (60 original drawings plus 49 additions: the remaining audited names used three or more times, everyday glyphs such as Sun/Moon, Eye/EyeOff, Info, Mail, Filter, Bookmark, media controls and Wifi).
- A browser check sampled every 16 ms of every timeline at 240 points per element (screen CTM, so CSS transforms and pivots apply): no visible point leaves the 24-unit frame including the 0.83 stroke margin, and the last frame matches the resting drawing as a point set (Hausdorff distance below sampling spacing). Flying icons (Send, External link) fade by distance so they are transparent before crossing the edge. The same sweep and filmstrips were repeated in WebKit: view-box pivots (bell crown, bin hinge, tassel) and write-on strokes match Chromium.
- Visible motion settles within 770 ms; the longest silent tail ends at 1.4 s. A hover during the visible part is ignored instead of snapping to rest.
- Reduced motion produced zero SVG animations across the full collection. Keyboard focus and pointer entry still trigger the same finite playback.
- Desktop 1440px and mobile 390px/320px have no horizontal overflow. The detail dialog supports short-screen vertical scrolling and horizontal code scrolling; Escape restores focus. Combined code copying and truthful permission-denied feedback were verified.
- Package tests, ESM/CJS/RSC and tree-shaking checks, Docs type checking, lint, and the production build passed. Screenshots are in `qa/icons/`.
