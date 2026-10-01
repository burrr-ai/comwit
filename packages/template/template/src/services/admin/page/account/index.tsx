'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'

import { Alert } from '@/lib/components/ui/alert'
import { Button } from '@/lib/components/ui/button'
import { Input } from '@/lib/components/ui/input'
import { TextField } from '@/lib/components/ui/text-field'
import {
  AdminPage,
  AdminPageHeader,
  AdminSection,
} from '@/services/admin/_components'
import { useAdminUser } from '@/services/admin/state/user'

export default function AdminAccount() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<
    { tone: 'success' | 'destructive'; text: string } | undefined
  >()
  const adminUser = useAdminUser((state) => ({
    isLoading: state.isLoading,
    actions: state.actions,
  }))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(undefined)

    if (newPassword !== confirmPassword) {
      setMessage({ tone: 'destructive', text: '새 비밀번호 확인이 일치하지 않습니다.' })
      return
    }

    try {
      await adminUser.actions.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ tone: 'success', text: '비밀번호를 변경했습니다.' })
    } catch (error) {
      setMessage({
        tone: 'destructive',
        text: error instanceof Error ? error.message : '비밀번호를 변경하지 못했습니다.',
      })
    }
  }

  return (
    <AdminPage width="3xl">
      <AdminPageHeader
        title="내 계정"
        description="현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다."
      />

      <AdminSection
        title="비밀번호 변경"
        description="변경이 완료되면 다른 기기의 관리자 세션은 로그아웃됩니다."
        icon={KeyRound}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField label="현재 비밀번호" required>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </TextField>
          <TextField label="새 비밀번호" helperText="8자 이상으로 입력해주세요." required>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
          </TextField>
          <TextField label="새 비밀번호 확인" required>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </TextField>

          {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={adminUser.isLoading}>
              {adminUser.isLoading ? '변경 중…' : '비밀번호 변경'}
            </Button>
          </div>
        </form>
      </AdminSection>
    </AdminPage>
  )
}
