<!-- app-setup:routing -->
## Mobile App Detail UI (app-setup installed)

Render **complete detail → list seed → full skeleton**, in that order. When a seed exists, preserve known content such as title and image, and load only the missing body.

```tsx
// The state adapter passes seed/detail; Props uses the domain summary/detail types.
function PostView({ seed, detail }: Props) {
  const header = detail ?? seed
  return (
    <DetailScreen fallback="/posts" actions={<ShareButton />}>
      {header ? (
        <>
          <PostHeader post={header} />
          {detail ? <PostBody post={detail} /> : <PostBodySkeleton />}
        </>
      ) : <PostSkeleton />}
    </DetailScreen>
  )
}
```

This example covers normal loading/success. Hide the seed for confirmed not-found or permission errors. On transient failure, preserve seed content with a partial error/retry; without a seed, show a full error screen. The server Suspense fallback is a simple `<PostSkeleton />`.

Wrap tabs in `AppScreen` and details in `DetailScreen` from `@/lib/components/ui/app-screen`, setting the title, actions, and parent `fallback` for back navigation. Default app-bar behavior is `flow` for tabs and `reveal` for details; override `appBarBehavior` only when needed. Wrap temporary compose/selection screens with `variant="sheet"` and add a sheet rule to `<AppShell>` in `layout/client.tsx`, for example `transitions={appTransitions(APP_TAB_PATHS, { transitions: [{ on: '/compose', transition: sheet() }] })}`. Import `appTransitions` and `sheet` from `@/lib/components/ui/page-transition`. For full-bleed hero details, use `bar="none"` and `FloatingBackButton` from `@/lib/components/ui/app-bar`.

All shell UI (AppShell, TabShell, AppScreen, app bar, BottomNav, glass, transitions, bottom sheets) is installed comwit-ui source in `@/lib/components/ui`. `layout/` holds only the tab list (`app-tabs.ts`) and PWA banner. Do not recreate shells, app bars, or tab bars; edit appearance through installed files and `src/app/globals.css` tokens.

For data wiring, follow Mobile App Detail State in `state.ai.md`.
<!-- /app-setup:routing -->
