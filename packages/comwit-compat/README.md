# comwit

> ⚠️ **Renamed to [`@comwit/state`](https://www.npmjs.com/package/@comwit/state).**

This package is deprecated. It now simply re-exports `@comwit/state` so existing
imports keep working, but you should migrate:

```bash
yarn remove comwit
yarn add @comwit/state
```

```diff
- import { model, action } from 'comwit'
+ import { model, action } from '@comwit/state'
```

The API is unchanged. See https://library.comwit.io.
