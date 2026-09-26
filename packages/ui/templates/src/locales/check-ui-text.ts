// 타입 검사 전용(레지스트리에 실리지 않는다): 모든 로케일이 영어판과 같은 키를 갖는지 확인한다.
import type { uiText as en } from '../lib/ui-text'
import { uiText as ko } from './ui-text.ko'

export const locales: Record<string, typeof en> = { ko }
