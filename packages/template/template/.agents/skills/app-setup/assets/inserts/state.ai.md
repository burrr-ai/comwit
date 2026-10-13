<!-- app-setup:detail-state -->
## Mobile App Detail State (app-setup installed)

**Read a seed by ID from the global list query and load the detail query independently.** Pass the seed to the view; never write, merge, or hydrate it into detail.

```tsx
// Shared client detail component in the service page layer.
function PostDetail({ id, load = false }: { id: string; load?: boolean }) {
  const post = usePost((state) => ({
    seed: state.posts.data.items.find((item) => item.id === id),
    detail: load ? state.detail.load(id) : state.detail,
  }))
  const detail = post.detail.isSuccess && post.detail.data?.id === id
    ? post.detail.data : undefined

  // Handle confirmed errors/not-found first according to domain policy.
  return <PostView seed={post.seed} detail={detail} />
}
```

```tsx
// Use for the client canonical route or the intercepted SEO detail route.
function PostClientRoute() {
  const { id } = useParams<{ id: string }>()
  return <PostDetail id={id} load />
}

// Hydrate detail only with a complete response from the SEO server loader.
function PostHydratedRoute({ id, initialPost }: Props) {
  usePost.hydrate({ detail: { arg: id, data: initialPost } })
  return <PostDetail id={id} />
}
```

Replace `posts` with the project's existing list query. Never refetch the list just to find a seed. Read seed/detail values only for the current ID and user scope; do not use `keepPreviousData` for detail queries. The hydration adapter does not subscribe to state.

For full/partial loading UI, follow Mobile App Detail UI in `page.ai.md`.
<!-- /app-setup:detail-state -->
