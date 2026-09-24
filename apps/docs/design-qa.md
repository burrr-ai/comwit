# Comwit Libraries visual and interaction QA

Date: 2026-09-24

Reference: the existing Comwit State panda illustration and documentation, Comwit service branding, and the approved brief: a restrained landing with a short introduction, State/UI entry points, and product symbols with text in the header. No new mascot is imposed on UI.

## Inspected surfaces

- Desktop landing and UI overview in the in-app browser.
- Landing and State/UI documentation at a 390 × 844 mobile viewport.
- Mobile UI navigation: expand, search for Dialog, navigate, and collapse.
- UI settings preview: edit the name, toggle notifications, submit, and show a local success state.
- Dialog preview: open, verify focus enters the dialog, dismiss with Escape, and verify focus returns to the trigger.
- Theme playground: change the brand hex value and inspect the iframe's CSS override. The outer document retains its original brand value.
- Legacy `/docs` navigation resolves to `/state/docs`.

## Corrections

- The Comwit header wordmark has no inherited icon gap.
- Active product navigation is legible on the neutral shell.
- Mobile State navigation uses dark text on its light background.
- UI theming uses a contained iframe with a responsive preview column and editable hex values.
- Alert preview content stacks vertically at narrow widths.

The browser instrumentation emitted a MutationObserver error when loading iframes. The same error was reproduced on a script-free HTML page containing only an iframe, independent of Comwit. Application interactions above remained functional.

## Build and integration evidence

- State: 478 tests passed.
- Workspace/CLI: both integration tests passed, including file installation, alias rewriting, preserving consumer changes, registry generation, and separate agent guides.
- Workspace typecheck passed.
- Documentation production build and lint passed.
- UI catalog and Storybook production builds passed.
- State playground build passed after adapting its ESLint configuration for its Next.js version and fixing existing lint findings.
- Packed CLI includes the generated registry.

final result: passed
