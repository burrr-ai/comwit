import 'server-only'
import { v7 } from 'uuid'

/**
 * UUID v7: time-ordered UUID (RFC 9562).
 * Its first 48 bits store the Unix millisecond timestamp, ordering IDs by creation time
 * and avoiding the random insertion pattern of v4 B-tree primary keys.
 */
export function uuid(): string {
  return v7()
}
