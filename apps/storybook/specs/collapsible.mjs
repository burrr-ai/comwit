export const specs = [
  {
    title: 'Collapsible',
    slug: 'collapsible',
    covers: ['collapsible'],
    imports: [
      {
        from: '@comwit/ui-templates/collapsible',
        names: ['Collapsible', 'CollapsibleTrigger', 'CollapsibleContent'],
      },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { ChevronsUpDown } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Default',
        description: '기본 접힘 상태(비제어) — 트리거를 눌러 내용을 펼친다',
        render: `<Collapsible className="w-80 space-y-2">
  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-4 py-2 text-body font-medium hover:bg-muted">
    자주 묻는 질문
    <ChevronsUpDown className="size-4 text-muted-foreground" />
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-1 rounded-md border px-4 py-2 text-body text-muted-foreground">
    <p>배송은 영업일 기준 2~3일 소요됩니다.</p>
    <p>주말 및 공휴일은 배송이 되지 않습니다.</p>
  </CollapsibleContent>
</Collapsible>`,
      },
      {
        name: 'DefaultOpen',
        description: 'defaultOpen 으로 펼쳐진 상태에서 시작',
        render: `<Collapsible defaultOpen className="w-80 space-y-2">
  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-4 py-2 text-body font-medium hover:bg-muted">
    상세 정보
    <ChevronsUpDown className="size-4 text-muted-foreground" />
  </CollapsibleTrigger>
  <CollapsibleContent className="rounded-md border px-4 py-2 text-body text-muted-foreground">
    처음부터 펼쳐진 채로 표시됩니다.
  </CollapsibleContent>
</Collapsible>`,
      },
      {
        name: 'Controlled',
        description: 'React.useState 로 open 상태 제어 · 외부 상태 표시',
        renderFn: `const [open, setOpen] = React.useState(false)
    return (
      <div className="w-80 space-y-3">
        <p className="text-caption text-muted-foreground">현재 상태: {open ? '펼침' : '접힘'}</p>
        <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-4 py-2 text-body font-medium hover:bg-muted">
            알림 설정
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 rounded-md border px-4 py-2 text-body text-muted-foreground">
            <p>이메일 알림</p>
            <p>푸시 알림</p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )`,
      },
      {
        name: 'Disabled',
        description: 'disabled — 트리거를 눌러도 열리지 않음',
        render: `<Collapsible disabled className="w-80 space-y-2">
  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-4 py-2 text-body font-medium disabled:cursor-not-allowed disabled:opacity-50">
    비활성화됨
    <ChevronsUpDown className="size-4 text-muted-foreground" />
  </CollapsibleTrigger>
  <CollapsibleContent className="rounded-md border px-4 py-2 text-body text-muted-foreground">
    열 수 없는 내용입니다.
  </CollapsibleContent>
</Collapsible>`,
      },
    ],
  },
]
