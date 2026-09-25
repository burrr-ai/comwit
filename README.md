<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/docs/public/brand/comwit-wordmark-dark.svg">
    <img src="apps/docs/public/brand/comwit-wordmark.svg" alt="Comwit" height="40">
  </picture>
</h1>

**The building blocks behind [comwit.io](https://comwit.io).**

Open-source State and UI libraries used in Comwit templates. Use either on its own, or together.

[Website](https://library.comwit.io) · [Releases](https://github.com/burrr-ai/comwit/releases)

| Library   | What it does                                                                    | Get started                                                                  |
| --------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **State** | Client state, queries, and actions through one typed domain hook.               | [Docs](https://library.comwit.io/state/docs) · [Source](packages/state/core) |
| **UI**    | Headless behavior and editable component sources you install into your project. | [Docs](https://library.comwit.io/ui) · [Source](packages/ui)                 |

## State

```bash
npm install @comwit/state
```

Supports React 18 and 19. Follow the [quickstart](https://library.comwit.io/state/docs/guide/quickstart), or give your coding agent [State's llms.txt](https://library.comwit.io/state/llms.txt).

## UI

```bash
npx comwit-ui@latest init
npx comwit-ui@latest add button dialog input
```

The CLI copies styled component sources into your project. You own and edit those files; `@comwit/ui` provides the underlying behavior. The templates use Tailwind CSS v4. See [installation](https://library.comwit.io/ui/docs/installation), [components](https://library.comwit.io/ui/components), or [UI's llms.txt](https://library.comwit.io/ui/llms.txt).

## Workspace

```text
apps/
  docs/                 Shared State + UI documentation
  state-playground/     State development app
  ui-dev/               UI development catalog
  storybook/            UI variants and interaction stories
packages/
  state/core/           @comwit/state
  ui/core/              @comwit/ui
  ui/templates/         @comwit/ui-templates — source for CLI and previews
  ui/cli/               comwit-ui — component installer
```

Each published package keeps its own version. The retired `comwit` compatibility wrapper is no longer maintained in this workspace; use `@comwit/state`.

## Development

Use Node.js 22.16+ and pnpm 11.3.0.

```bash
pnpm install
pnpm dev:docs
```

| Command                          | Purpose                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| `pnpm build`                     | Build libraries, generate UI docs, and build the documentation site |
| `pnpm test`                      | Run State tests and workspace/CLI integration checks                |
| `pnpm typecheck`                 | Generate artifacts and check all typed workspaces                   |
| `pnpm dev:state` / `pnpm dev:ui` | Watch the corresponding runtime package                             |
| `pnpm dev:playground`            | State playground, port 3001                                         |
| `pnpm dev:ui-catalog`            | UI catalog, port 3007                                               |
| `pnpm storybook`                 | UI stories, port 6008                                               |
| `pnpm registry`                  | Regenerate the bundled component registry                           |

For catalog/Storybook development, run `pnpm build:packages` first and keep `pnpm dev:ui` running when editing the headless engine. See [contributing](CONTRIBUTING.md) for documentation generation and release checks.

## License

[MIT](LICENSE)
