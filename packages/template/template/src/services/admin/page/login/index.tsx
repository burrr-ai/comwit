'use client'

import { useState } from 'react'
import { Button } from '@/lib/components/ui/button'
import { Input } from '@/lib/components/ui/input'
import { TextField } from '@/lib/components/ui/text-field'
import { adminCard } from '@/services/admin/_components'
import { cn } from '@/lib/utils'

/**
 * Admin Login — `@/lib/components/ui` 컨트롤 + 어드민 카드 표면.
 * 공개 관리자 회원가입은 제공하지 않는다.
 * TODO: auth-setup 후 실제 로그인 액션 연결(handleSubmit).
 */
export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      // TODO: await adminUser.signIn({ email, password })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-6">
      <div className={cn(adminCard, 'w-full max-w-[380px] p-8')}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-title-lg">관리자 로그인</h1>
            <p className="text-body-sm text-muted-foreground">관리자 계정으로 로그인하세요</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <TextField label="이메일" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </TextField>
              <TextField label="비밀번호" required>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </TextField>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? '로그인 중…' : '로그인'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
