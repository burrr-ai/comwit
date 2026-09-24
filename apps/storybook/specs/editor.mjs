export const specs = [
  {
    title: 'Editor',
    slug: 'editor',
    covers: ['editor'],
    imports: [{ from: '@comwit/ui-templates/editor', names: ['Editor'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Editable',
        description: '툴바가 있는 편집 가능한 에디터 (placeholder)',
        render: `<div className="max-w-2xl">
  <Editor placeholder="내용을 입력하세요..." />
</div>`,
      },
      {
        name: 'ReadOnly',
        description: 'editable={false} — 툴바 없이 읽기 전용, 기본 HTML 값 표시',
        render: `<div className="max-w-2xl">
  <Editor
    editable={false}
    value={\`<h2>공지사항</h2><p>안녕하세요, <strong>커뮤니티</strong> 회원 여러분. 이번 주 업데이트 소식을 전해드립니다.</p><ul><li>첫 번째 항목</li><li>두 번째 항목</li></ul><blockquote>참여해 주셔서 감사합니다.</blockquote>\`}
  />
</div>`,
      },
      {
        name: 'Controlled',
        description: 'value + onChange 로 제어 (React.useState) — 하단에 HTML 출력 미리보기',
        renderFn: `const [html, setHtml] = React.useState('<p>여기에 <strong>입력</strong>해 보세요.</p>')
return (
  <div className="max-w-2xl space-y-3">
    <Editor value={html} onChange={setHtml} placeholder="내용을 입력하세요..." />
    <pre className="overflow-x-auto rounded-md border bg-muted p-3 text-caption text-muted-foreground">{html}</pre>
  </div>
)`,
      },
    ],
  },
]
