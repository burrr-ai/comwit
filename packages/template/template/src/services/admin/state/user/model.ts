import { model, query } from '@comwit/state'
import { adminUser as userApi } from '@/services/admin/api/user'
import type { User, UserState } from './types'

export const user = model<UserState>({
  // The server layout awaits data and initializes it with useAdminUser.hydrate.
  // Views read me.data; initial loading needs neither me.load() nor useEffect.
  me: query<User | null>({
    initialData: null,
    queryFn: () => userApi.getMe(),
  }),
  isLoading: false,
})
