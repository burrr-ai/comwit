import { model, query } from '@comwit/state'
import { user as userApi } from '@/services/app/api/user'
import type { User, UserState } from './types'

export const user = model<UserState>({
  // 서버 레이아웃이 먼저 await하고 useUser.hydrate로 초기화한다.
  // 화면에서는 me.data를 읽는다. 초기 로딩을 위한 me.load()/useEffect는 필요 없다.
  me: query<User | null>({
    initialData: null,
    queryFn: () => userApi.getMe(),
  }),
  isLoading: false,
})
