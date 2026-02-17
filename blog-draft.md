# 리액트에서 데코레이터 쓰기 — LLM이 못 해주는 클린코드

## 서론

LLM이 코드를 짜주는 시대다. Claude에게 "게시글 CRUD 만들어줘" 하면 5분이면 나온다. 근데 그렇게 만든 코드로 3개월 운영해보면 안다. 결국 사람이 구조를 잡아주지 않으면 코드는 산으로 간다.

바이브코딩 플랫폼을 만들면서 이걸 뼈저리게 느꼈다. LLM이 생성한 프로젝트가 1000개를 넘어가면서, 하나의 패턴이 보이기 시작했다. **잘 되는 프로젝트는 구조가 잡혀 있었고, 망하는 프로젝트는 구조 없이 기능만 쌓아올린 프로젝트였다.**

클린코드는 단순히 "보기 좋은 코드"가 아니다. 변경에 강한 코드다. 그리고 변경에 강한 코드를 작성하는 능력은 이직 면접에서 시니어와 주니어를 가르는 기준이기도 하다. 면접관이 "상태관리 어떻게 하세요?"라고 물었을 때, "useState 쓰고 zustand 씁니다"가 아니라 **어떤 설계 원칙 위에서 상태를 관리하는지** 말할 수 있는 사람이 붙는다.

그래서 우리가 내부에서 쓰던 상태관리 라이브러리를 오픈소스로 공개했다. **comwit**이라는 이름이다. 이 글에서는 comwit의 핵심 철학 중 하나인 **데코레이터 패턴**을 중심으로, React에서 클린코드를 작성하는 방법을 소개한다.

---

## 본론 1: 데코레이터, 이게 React에서 된다고?

### try-catch 지옥부터 보자

React에서 비동기 로직을 짜면 이런 코드가 반복된다.

```ts
async function createPost(title: string) {
  try {
    const created = await api.post.create({ title })
    setPosts((prev) => [...prev, created])
    toast.success('작성 완료!')
    router.push('/posts')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '실패했습니다')
    console.error(error)
  }
}

async function deletePost(postId: string) {
  try {
    await api.post.delete(postId)
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    toast.success('삭제 완료!')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '실패했습니다')
    console.error(error)
  }
}
```

보이는가? **에러 처리와 성공 처리가 비즈니스 로직에 섞여 있다.** 두 함수 모두 `try-catch` 안에 toast 로직이 들어가 있고, 에러 핸들링 코드가 복붙되어 있다. 함수가 10개면 이 패턴이 10번 반복된다.

백엔드 개발자라면 여기서 "이거 AOP로 빼면 되는 거 아냐?"라고 생각할 것이다. 맞다. Spring에서는 `@Transactional`, `@Cacheable` 같은 어노테이션으로 횡단 관심사를 깔끔하게 분리한다.

**React에서도 할 수 있다.**

### comwit의 데코레이터

같은 코드를 comwit으로 작성하면 이렇게 된다.

```ts
import { action, OnError, OnSuccess } from 'comwit'

export const postActions = action<Pick<PostActions, 'create' | 'delete'>, AppContext>(
  ({ state, context }) => {
    class PostActions {
      private model = state(post)

      @OnSuccess(() => {
        toast.success('작성 완료!')
        context.router.push('/posts')
      })
      @OnError((e) => toast.error(e instanceof Error ? e.message : '실패했습니다'))
      async create(title: string) {
        const created = await api.post.create({ title })
        this.model.posts.data.push(created)
      }

      @OnSuccess(() => toast.success('삭제 완료!'))
      @OnError((e) => toast.error(e instanceof Error ? e.message : '실패했습니다'))
      async delete(postId: string) {
        await api.post.delete(postId)
        this.model.posts.data = this.model.posts.data.filter((p) => p.id !== postId)
      }
    }
    return new PostActions()
  }
)
```

**비즈니스 로직과 횡단 관심사가 완전히 분리되었다.** `create` 메서드의 본문에는 "게시글을 만들고 목록에 추가한다"는 핵심 로직만 남았다. 성공/실패 시 어떤 일이 일어나는지는 데코레이터가 선언적으로 표현한다.

### 내장 데코레이터 5종

comwit이 제공하는 데코레이터는 다섯 가지다.

**`@OnError(handler)`** — 에러가 발생하면 handler를 실행한다. 에러는 그대로 전파된다.

```ts
@OnError((e) => toast.error(e instanceof Error ? e.message : '에러 발생'))
async save() { /* ... */ }
```

**`@OnSuccess(handler)`** — 성공하면 handler를 실행한다. 반환값을 받을 수 있다.

```ts
@OnSuccess(() => router.push('/list'))
async create() { /* ... */ }
```

**`@Debounce(ms)`** — 연속 호출을 제한한다. 검색 입력에 적합하다.

```ts
@Debounce(300)
async search(keyword: string) {
  await this.model.posts.query(keyword)
}
```

**`@Throttle(ms)`** — 일정 간격으로만 실행한다. 스크롤 이벤트에 적합하다.

```ts
@Throttle(1000)
async trackScroll(position: number) { /* ... */ }
```

**`@Authorized({ when, onDeny })`** — 조건을 검사하고, 실패 시 대체 동작을 실행한다.

```ts
@Authorized({
  when: () => Boolean(user.me),
  onDeny: () => router.push('/login'),
})
async create(title: string) { /* ... */ }
```

### 커스텀 데코레이터: createInterceptor

내장 데코레이터만으로 부족할 때, `createInterceptor`로 자신만의 데코레이터를 만들 수 있다. Spring의 커스텀 어노테이션과 같은 개념이다.

```ts
import { createInterceptor, onAuthorized } from 'comwit'
import { user } from '@/state/user/model'

// 로그인 필수 데코레이터
const LoginRequired = createInterceptor<AppContext>(({ state, context }) => {
  const u = state(user)
  return onAuthorized({
    when: () => Boolean(u.me),
    onDeny: () => context.router.push('/login'),
  })
})
```

이렇게 만든 데코레이터는 어디서든 재사용할 수 있다.

```ts
@LoginRequired
@OnSuccess(() => context.router.push('/posts'))
async create(title: string) {
  const created = await api.post.create({ title })
  this.model.posts.data.push(created)
}
```

`if (!this.user.me) return` 같은 방어 코드를 매번 작성하는 대신, `@LoginRequired` 한 줄로 의도를 선언한다. **코드를 읽는 사람은 메서드 본문을 보기 전에 이미 "이 메서드는 로그인이 필요하고, 성공하면 리다이렉트 된다"는 것을 안다.**

이것이 데코레이터가 주는 가장 큰 가치다. 코드가 **자기 자신을 설명한다.**

---

## 본론 2: 도메인 단위로 코드를 나누는 구조

데코레이터가 메서드 수준의 클린코드라면, 도메인 구조는 프로젝트 수준의 클린코드다.

comwit은 기능별로 코드를 나누는 도메인 드리븐 폴더 구조를 따른다.

```
state/
  post/
    types.ts      ← 상태 + 액션 타입 정의 (계약서)
    model.ts      ← 초기 상태 + query 정의
    actions/
      crud.ts     ← 생성, 수정, 삭제
      load.ts     ← 데이터 페칭
      init.ts     ← SSR 하이드레이션
    index.ts      ← create() 훅 + re-export
```

`types.ts`를 열면 그 도메인이 뭘 하는지 한눈에 보인다. 이게 사람에게도 좋지만, **LLM에게는 결정적이다.** LLM이 "댓글 기능 추가해줘"라는 요청을 받았을 때, `state/post/types.ts` 하나만 읽으면 전체 맥락을 파악할 수 있으니까.

도메인 구조에 대해서는 [Why Domain-Driven Design Matters More in the AI Era](https://comwit.io/blog/why-domain-driven) 글에서 더 깊이 다루고 있다.

### 내장 query: TanStack Query 없이 데이터 페칭

comwit의 모델에는 데이터 페칭이 내장되어 있다.

```ts
import { model, query } from 'comwit'

export const post = model<PostState>({
  posts: query<Post[]>({
    initialData: [],
    queryFn: () => api.post.findAll(),
  }),
  current: null,
})
```

`query()`로 정의한 필드는 자동으로 `isLoading`, `isFetching`, `isSuccess`, `isError`, `error` 상태를 가진다. `staleTime`, `cacheTime`, `gcTime`, `placeholderData` 옵션도 지원한다. TanStack Query에서 익숙한 그 인터페이스다.

```tsx
const { posts } = usePost((s) => ({ posts: s.posts }))

if (posts.isLoading) return <Skeleton />
if (posts.isError) return <p>{posts.error}</p>
return posts.data.map((p) => <PostCard key={p.id} post={p} />)
```

별도의 query hook을 import하지 않는다. **상태와 데이터 페칭이 하나의 모델 안에 통합되어 있다.**

---

## 본론 3: SSR에서 전역 상태가 위험한 이유

여기서부터가 조금 깊은 이야기다. React에서 전역 상태관리를 SSR 환경에서 쓸 때, 대부분의 라이브러리가 가진 구조적 문제가 있다.

### 모듈 스코프 상태의 함정

zustand이나 jotai의 일반적인 사용법을 보자.

```ts
// zustand — 모듈 스코프에 스토어가 생성됨
const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))
```

이 코드에서 `useStore`는 **모듈 레벨에서 단 한 번 생성된다.** 클라이언트에서는 문제가 없다. 브라우저 탭 하나에 사용자 하나니까.

하지만 SSR에서는 다르다. Node.js 서버는 모듈을 한 번 로드하고 **모든 요청에서 공유한다.** 사용자 A의 요청이 전역 스토어에 데이터를 넣으면, 직후에 들어온 사용자 B의 요청이 그 데이터를 볼 수 있다. 인증 토큰이나 개인 정보가 다른 사용자에게 노출될 수 있는 것이다.

물론 zustand도 `createStore` + Context 패턴으로 이 문제를 해결할 수 있고, jotai도 `Provider`로 스코프를 나눌 수 있다. 하지만 중요한 것은 **그렇게 하지 않아도 코드가 돌아간다는 것이다.** 기본 사용법이 안전하지 않은 패턴을 허용하고, 안전한 패턴은 추가 설정으로 가야 한다.

### comwit의 접근: Provider가 생명주기를 가둔다

comwit은 설계부터 다르다. **모든 상태 인스턴스는 `MuchaProvider` 안에서 생성된다.**

```tsx
<MuchaProvider context={context}>{children}</MuchaProvider>
```

`model()`로 정의한 것은 템플릿이지 인스턴스가 아니다. 실제 상태는 Provider가 마운트될 때 생성되고, 언마운트되면 사라진다. 모듈 스코프에 상태가 남지 않는다.

```ts
// 이것은 "설계도"이지 "상태"가 아니다
export const post = model<PostState>({
  posts: query<Post[]>({ initialData: [], queryFn: () => api.post.findAll() }),
  current: null,
})
```

코드 레벨에서 SSR 오염이 **구조적으로 불가능하다.** "조심해서 쓰면 된다"가 아니라 "잘못 쓸 수가 없다"는 것. 이게 프레임워크 수준의 안전성이다.

### SSR 하이드레이션: silent()

서버에서 받은 초기 데이터를 클라이언트 상태에 넣을 때는 `silent()`를 사용한다.

```ts
import { action, silent } from 'comwit'

export const postActions = action<Pick<PostActions, 'init'>>(({ state }) => {
  class Actions {
    private model = state(post)

    init(data: Post) {
      silent(() => {
        this.model.current = data
      })
    }
  }
  return new Actions()
})
```

`silent()` 안에서의 상태 변경은 리렌더를 트리거하지 않는다. 서버 컴포넌트에서 받은 데이터를 안전하게 주입할 수 있다.

```tsx
// 서버 컴포넌트에서 데이터를 받아서
function PostDetail({ initialPost }: { initialPost: Post }) {
  const { actions } = usePost((s) => ({ actions: s.actions }))
  actions.init(initialPost) // useEffect 없이 직접 호출 — silent()가 안전하게 처리
  return <Article />
}
```

---

## 결론

정리하면 이렇다.

LLM 시대에도 사람이 해야 할 일이 있다. **구조를 잡는 것이다.** 데코레이터 패턴으로 횡단 관심사를 분리하고, 도메인 단위로 코드를 조직하고, SSR 환경에서 안전한 상태 생명주기를 설계하는 것. 이런 것들은 LLM에게 "해줘"라고 말해서 되는 것이 아니라, 사람이 설계하고 LLM이 그 안에서 작업하게 만들어야 한다.

comwit은 바이브코딩 플랫폼을 만들면서 이 문제들을 직접 부딪히며 만든 라이브러리다. 이미 1000개 이상의 프로젝트에서 돌아가고 있고, 이제 오픈소스로 공개한다.

**지금 바로 써보고 싶다면:**

GitHub: [https://github.com/meursyphus/comwit](https://github.com/meursyphus/comwit) — 스타 하나가 큰 힘이 됩니다.

Claude Code나 Cursor를 쓰고 있다면, 이 한 줄이면 세팅 끝이다:

```
comwit.io/llm.txt
```

LLM에게 이 URL을 알려주고 "이걸 읽고 프로젝트에 comwit 세팅해줘"라고 하면 된다. 도메인 구조부터 데코레이터 패턴까지, LLM이 알아서 잡아준다.

**구조를 잡는 건 사람의 몫이다. 하지만 그 구조를 따르는 건 LLM이 해줄 수 있다.**
