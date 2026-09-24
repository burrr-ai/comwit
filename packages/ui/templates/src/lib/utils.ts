import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** clsx + tailwind-merge — 조건부 클래스 결합 + 충돌 유틸리티 병합. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
