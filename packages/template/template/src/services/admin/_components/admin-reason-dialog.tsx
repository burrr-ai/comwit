'use client'

import { useState } from 'react'

import { Button } from '@/lib/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/components/ui/dialog'
import { Input } from '@/lib/components/ui/input'

type AdminReasonDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Label identifying the action target. */
  targetLabel?: string
  reasonPlaceholder?: string
  confirmLabel?: string
  confirmTone?: 'destructive' | 'default'
  submitting?: boolean
  onConfirm: (reason: string | null) => Promise<void> | void
}

/**
 * Reason-entry confirmation dialog for reversible actions such as hiding or removing.
 * Generalized from the moderation HideDialog.
 */
export function AdminReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  targetLabel,
  reasonPlaceholder = '사유 (선택)',
  confirmLabel = '확인',
  confirmTone = 'destructive',
  submitting,
  onConfirm,
}: AdminReasonDialogProps) {
  const [reason, setReason] = useState('')

  function handleClose() {
    setReason('')
    onOpenChange(false)
  }

  async function handleConfirm() {
    const trimmed = reason.trim()
    await onConfirm(trimmed === '' ? null : trimmed)
    setReason('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="space-y-2.5 pt-1">
          {targetLabel ? (
            <p className="truncate text-label text-muted-foreground">
              대상: <span className="text-foreground">{targetLabel}</span>
            </p>
          ) : null}
          <Input
            placeholder={reasonPlaceholder}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={submitting}
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            variant={confirmTone === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? '처리 중…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
