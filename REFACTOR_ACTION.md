# Refactor: `action()` 책임 이관 + `createInterceptor` 도입

## 배경

### 현재 문제

1. **`action()`이 identity 함수** — 타입 추론 외에 아무것도 안 함

   ```ts
   // packages/mucha/src/core/action.ts
   export function action<A, C>(factory: ActionFactory<A, C>): ActionFactory<A, C> {
     return factory // 그냥 리턴
   }
   ```

2. **`create()`가 너무 많은 일을 함** — React hook 역할 + action 인스턴스화 + normalizeActions + state() 생성이 전부 `create()` 안에 있음

   ```
   // packages/mucha/src/core/index.ts 의 create() 내부:
   - state() 함수 생성 (63-81행)
   - context 가져오기 (83행)
   - factory 호출 + normalizeActions (84-87행)
   - React hook: subscribe, getSnapshot, useSyncExternalStore (90-109행)
   ```

3. **상태 의존 데코레이터를 재사용할 수 없음** — `@Authorized` 같은 데코레이터가 model/context에 접근하려면 매번 action factory 클로저 안에서 선언해야 함. 여러 action factory에서 같은 `@LoginRequired`를 쓰고 싶어도 반복 코드가 필수.

### SSR 제약

모듈 스코프에 실제 상태(인스턴스)를 두면 서로 다른 유저 요청 간 상태가 오염됨. 따라서:

- `model()`, `action()`은 **팩토리(설계도)** 역할만 해야 함
- 실제 인스턴스는 **Provider(요청 단위)** 안에서 생성되어야 함
- 이 제약은 유지해야 함

### 데코레이터 두 종류

- **독립적** — `@Debounce(300)`, `@OnError(...)`, `@OnSuccess(...)` → 상태 접근 불필요. 지금도 import해서 바로 쓸 수 있음. 변경 없음.
- **상태 의존적** — `@Authorized` 등 → model이나 context를 읽어야 함. 현재 factory 클로저 안에서만 선언 가능. **이것이 개선 대상.**

---

## 변경 목표

### 1. `action()`에 `normalizeActions` 책임 이관

현재 `create()` 안의 `normalizeActions()`를 `action()` 쪽으로 이동.

`action()`이 factory를 감싸서, 호출 시점(`{ state, context }` 주입 시)에:

1. factory를 호출하여 class 인스턴스를 받고
2. prototype 메서드를 순회하며 bind 처리 (현재 `normalizeActions` 로직)
3. lazy interceptor가 있으면 resolve (아래 2번 참고)
4. 최종 plain object를 반환

이렇게 하면 `create()`는 action factory를 호출만 하면 바로 쓸 수 있는 객체를 받고, React hook + 구독 로직에만 집중.

**참고 파일:**

- `packages/mucha/src/core/index.ts` — `normalizeActions` 함수 (20-46행), create 내부 factory 호출 (84-87행)
- `packages/mucha/src/core/action.ts` — 현재 identity 함수

### 2. `createInterceptor` 도입 — 상태 의존 데코레이터 재사용

새 API: `createInterceptor`

```ts
// 시그니처
function createInterceptor(
  factory: (ctx: { state: State; context: any }) => MethodDecorator
): MethodDecorator // 반환값은 "lazy decorator" — 마커만 남기고, 나중에 resolve됨
```

**사용 예시:**

```ts
// interceptors/auth.ts
import { createInterceptor, Authorized } from 'muchajs'
import { userModel } from '@/state/user/model'
import type { AppActionContext } from '@/app/action-context'

export const LoginRequired = createInterceptor<AppActionContext>(({ state, context }) => {
  const user = state(userModel)
  return Authorized({
    when: () => Boolean(user.me),
    onDeny: () => context.router.push('/login'),
  })
})
```

```ts
// state/todo/actions/crud.ts
import { action } from 'muchajs'
import { LoginRequired } from '@/interceptors/auth'
import { todoModel } from '../model'

export const todoCrudActions = action(({ state }) => {
  class TodoCrudActions {
    private model = state(todoModel)

    @LoginRequired // ← import해서 바로 사용
    async create(title: string) {
      this.model.todos.push(await api.createTodo({ title }))
    }

    @LoginRequired
    async delete(id: string) {
      this.model.todos = this.model.todos.filter((t) => t.id !== id)
    }
  }
  return new TodoCrudActions()
})
```

**동작 원리:**

1. `createInterceptor(factory)`는 MethodDecorator를 반환하지만, 이 decorator는 실제 interceptor를 적용하지 않음
2. 대신 메서드에 **마커(메타데이터)** 를 남김 — "이 메서드는 나중에 이 factory로 resolve해야 한다"
3. `action()`이 factory 결과(class 인스턴스)를 받아 `normalizeActions` 과정에서:
   - 각 메서드에 lazy interceptor 마커가 있는지 검사
   - 있으면 현재 `{ state, context }`로 interceptor factory를 호출하여 실제 decorator를 얻고 적용
4. SSR-safe: 모듈 스코프에는 팩토리만 존재, 실제 상태 접근은 Provider 안에서 발생

**마커 구현 힌트:**

- 메서드에 Symbol 기반 프로퍼티로 interceptor factory 목록을 저장하는 방식
- 예: `method[LAZY_INTERCEPTORS] = [factory1, factory2]`
- `createDecorator` (interceptors/utils.ts:13-18행)의 패턴을 참고하되, descriptor.value를 바로 교체하는 대신 마커를 추가

---

## 변경하지 않는 것

- `model()` — 그대로 유지
- `create()` — React hook / subscribe / getSnapshot 로직은 그대로. action factory 호출 + normalize 부분만 `action()`에 위임
- 독립적 데코레이터 (`@Debounce`, `@OnError`, `@OnSuccess`, `@Throttle`, `@Transaction`) — 변경 없음
- `silent()`, `query()`, `MuchaProvider` — 변경 없음
- 기존 `@Authorized` 직접 사용 방식 — 호환성 유지. factory 안에서 직접 `Authorized({...})`로 쓰는 기존 패턴도 계속 동작해야 함

---

## 변경 대상 파일

| 파일                                       | 변경 내용                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `packages/mucha/src/core/action.ts`        | `action()`이 factory를 감싸서 호출 시 normalize + interceptor resolve 수행                                |
| `packages/mucha/src/core/index.ts`         | `normalizeActions` 제거, `create()` 내부에서 action factory 호출 후 normalize 로직 삭제 (action()에 위임) |
| `packages/mucha/src/interceptors/utils.ts` | lazy interceptor 마커용 Symbol, `createInterceptor` 함수 추가                                             |
| `packages/mucha/src/interceptors/index.ts` | `createInterceptor` export 추가                                                                           |
| 메인 export (index or barrel)              | `createInterceptor` 외부 노출                                                                             |

---

## 최종 구조 (변경 후)

```
action(factory)
  └─ factory 호출 시:
     1. factory({ state, context }) → class 인스턴스
     2. normalizeActions — 메서드 바인딩
     3. lazy interceptor resolve — { state, context }로 실제 decorator 적용
     4. → plain object 반환

create(model, { actions })
  └─ React hook 전용:
     1. state() 함수 생성 (registry 기반)
     2. action factory들 호출 (action()이 normalize + resolve 처리)
     3. useSyncExternalStore로 구독
```
