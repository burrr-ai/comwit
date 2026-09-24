'use client'

/**
 * rich-text — tiptap 리치텍스트 에디터 헤드리스 엔진.
 *
 * `useEditor(...)` 구성 전부(StarterKit · Placeholder · Link · Image ·
 * immediatelyRender · editorProps.attributes prose 클래스 · onUpdate → onChange)와
 * value→setContent / editable→setEditable 동기화 useEffect 두 개를 소유한다.
 * 시각/툴바(제어 표면)는 소비 레이어(@comwit/ui-templates)가 이 에디터 인스턴스를 구동한다.
 */

import * as React from 'react'
import { useEditor, type Editor as TiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

export type { TiptapEditor }

// 이 엔진이 구성한 확장들(StarterKit·Link·Image)은 각자의 커맨드
// (toggleBold/setLink/unsetLink/setImage/undo/redo …)를 `@tiptap/core` 의 module
// augmentation 으로 등록한다. 위 값(value) import 들은 발행되는 `.d.ts` 에서 지워지므로,
// 확장의 옵션 '타입'을 여기서 재-export 해 커맨드 augmentation 이 @comwit/ui 발행 타입과
// 함께 실려가게 한다 → 소비 레이어(templates 툴바)가 tiptap 확장을 직접 import 하지 않고도
// `editor.chain()/can()` 를 완전히 타입 안전하게 쓴다.
export type { StarterKitOptions } from '@tiptap/starter-kit'
export type { LinkOptions } from '@tiptap/extension-link'
export type { ImageOptions } from '@tiptap/extension-image'

export function useRichTextEditor(opts: {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  editable?: boolean
}): TiptapEditor | null {
  const { value = '', onChange, placeholder, editable = true } = opts

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? '내용을 입력하세요...',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image,
    ],
    content: value,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-40 px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  React.useEffect(() => {
    if (!editor) return
    if (value === editor.getHTML()) return
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [value, editor])

  React.useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  return editor
}
