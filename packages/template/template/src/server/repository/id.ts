import 'server-only'
import { v7 } from 'uuid'

/**
 * UUID v7 — time-ordered UUID (RFC 9562).
 * 앞 48비트가 unix ms 타임스탬프라 생성 순서대로 정렬되며, DB PK로 안전하다 (v4와 달리 B-Tree 인덱스 단편화 없음).
 */
export function uuid(): string {
  return v7()
}
