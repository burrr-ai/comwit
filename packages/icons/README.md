# @comwit/icons

Original Comwit icons: 60 familiar shapes on a 24 × 24 grid, with optional motion for each one. MIT licensed. The first collection follows the most-used Lucide names in the Comwit app; its SVG geometry and motion are authored here, not re-exported from Lucide.

**Preview:** this package is prepared for its first release. The npm install command becomes available after publishing; this repository uses the workspace package today.

```sh
pnpm add @comwit/icons
```

```tsx
import { SearchIcon, CheckIcon } from '@comwit/icons'
import { AnimatedBellIcon } from '@comwit/icons/animated'

<SearchIcon size={20} />
<CheckIcon title="Saved" color="var(--success)" />
<button data-icon-trigger aria-label="Notifications">
  <AnimatedBellIcon size={20} />
</button>
```

Static exports are pure SVG functions and work in React Server Components. Animated exports have a preserved `use client` boundary and use the browser Web Animations API; they need no animation library or stylesheet. Both accept `size` (default 24), `color` (default `currentColor`), `strokeWidth` (default 1.65), `className`, `style`, `title`, and SVG attributes. Icons are decorative by default. Use `title`, `aria-label`, or `aria-labelledby` when an icon conveys meaning without accompanying text. Label the enclosing button when an icon is its only content.

## Motion

| Prop                         | Behavior                                                                   |
| ---------------------------- | -------------------------------------------------------------------------- |
| `animateOn="hover"`          | Default. Play once on pointer entry or keyboard focus.                     |
| `animateOn="click"`          | Play once on click.                                                        |
| `animateOn="mount"`          | Play once on mount.                                                        |
| `animateOn="none"`           | Only play when `replayKey` changes.                                        |
| `replayKey={numberOrString}` | A new value replays feedback; its initial value does not trigger playback. |

Add `data-icon-trigger` to the enclosing button or link to make its entire area trigger the icon. Without it, events are observed on the SVG itself. `hover` also responds to keyboard focus on the marked control. Click mode uses the control's native keyboard click behavior.

```tsx
'use client'

import { useState } from 'react'
import { AnimatedCopyIcon } from '@comwit/icons/animated'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(0)
  const [status, setStatus] = useState('')
  return (
    <>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text)
            setCopied((count) => count + 1)
            setStatus('Copied')
          } catch {
            setStatus('Copy failed. Please copy the text manually.')
          }
        }}
      >
        <AnimatedCopyIcon animateOn="none" replayKey={copied} />
        Copy
      </button>
      <span role="status">{status}</span>
    </>
  )
}
```

Motion is finite (including the loader preview), ends at the resting drawing, and stops immediately when the user enables reduced motion. Event listeners and animations are cleaned up on unmount. Browsers without Web Animations keep the static drawing. An animated component forwards its ref to the SVG; static named components intentionally do not expose a ref prop.

`/catalog` contains metadata and all drawings for galleries. Application code should use named imports from the root or `/animated` so bundlers can remove unused icons. Static imports also omit animation keyframes.

## Design and contribution

- 24 × 24 canvas; primarily 3–21 safe drawing bounds, with optical adjustments.
- 1.65-unit stroke, rounded caps and joins, open interiors, restrained corner radii.
- Use meaningful moving groups: a bell's body, a document's lines, a bin's lid.
- Keep finite motions short and restore the exact resting shape; avoid whole-grid autoplay.
- Keep English names compatible with the audited imports, adding `Icon` to static exports and `Animated…Icon` to animated ones. Similar Lucide names are not automatic aliases.

Edit `src/definitions/actions.ts` or `objects.ts`, then run:

```sh
pnpm --filter @comwit/icons build
pnpm --filter @comwit/icons typecheck
pnpm --filter @comwit/icons test
```

The generator produces independently tree-shakeable definitions and named exports. Do not edit generated files by hand. View `/ui/icons` in Docs for both light/dark preview, size/color controls, search, and usage snippets.

The first 60 icons cover 729 of 931 named runtime imports (78%) in the audited app. The selection audit is in `usage-audit.json`: it counts named runtime imports across the app's `src`, not rendered instances. Refresh against a local application with:

```sh
node packages/icons/scripts/audit-usage.mjs /path/to/application/src > packages/icons/usage-audit.json
```

This package does not migrate the Comwit application or replace the UI templates' existing Lucide imports. It provides the first independent collection for evaluation and gradual adoption.
