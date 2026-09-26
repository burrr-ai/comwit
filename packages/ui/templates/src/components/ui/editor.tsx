'use client'

import * as React from 'react'
import { EditorContent } from '@tiptap/react'
import { useRichTextEditor, type TiptapEditor } from '@comwit/ui'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from 'lucide-react'

import { focusWithinField } from '../../lib/interaction'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'
import { Button } from './button'
import { Separator } from './separator'

export interface EditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
  /** 편집 영역 id — <Label htmlFor> 와 잇는다 */
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-invalid'?: boolean
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  label,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  label: string
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="size-8"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  )
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const setLink = React.useCallback(() => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt(uiText.editor.linkUrl, previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = React.useCallback(() => {
    const url = window.prompt(uiText.editor.imageUrl)
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-1">
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Ordered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </ToolbarButton>
      <ToolbarButton
        label="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}>
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton label="Image" onClick={addImage}>
        <ImageIcon />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton
        label="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo />
      </ToolbarButton>
    </div>
  )
}

function Editor({
  value = '',
  onChange,
  placeholder,
  className,
  editable = true,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-invalid': ariaInvalid,
}: EditorProps) {
  const attributes = Object.fromEntries(
    Object.entries({
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-invalid': ariaInvalid ? 'true' : undefined,
    }).filter((entry): entry is [string, string] => entry[1] !== undefined)
  )
  const editor = useRichTextEditor({ value, onChange, placeholder, editable, attributes })

  if (!editor) return null

  return (
    <div
      data-slot="editor"
      data-invalid={ariaInvalid || undefined}
      className={cn(
        'border-input rounded-control border bg-transparent transition-[border-color,box-shadow]',
        focusWithinField,
        'data-[invalid=true]:border-destructive',
        className
      )}
    >
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}

export { Editor }
