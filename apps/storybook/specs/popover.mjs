export const specs = [
  {
    title: 'Popover',
    slug: 'popover',
    covers: ['popover'],
    imports: [
      {
        from: '@comwit/ui-templates/popover',
        names: ['Popover', 'PopoverTrigger', 'PopoverContent'],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    stories: [
      {
        name: 'Default',
        description: '트리거를 누르면 콘텐츠가 열리는 기본 팝오버',
        render: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">팝오버 열기</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <p className="text-body font-medium">알림 설정</p>
      <p className="text-caption text-muted-foreground">
        새로운 소식과 업데이트를 이곳에서 확인할 수 있습니다.
      </p>
    </div>
  </PopoverContent>
</Popover>`,
      },
      {
        name: 'Alignments',
        description: 'align 세 가지 정렬 (start · center · end)',
        render: `<div className="flex flex-wrap items-center gap-3">
  {(['start', 'center', 'end'] as const).map((align) => (
    <Popover key={align}>
      <PopoverTrigger asChild>
        <Button variant="outline">{align}</Button>
      </PopoverTrigger>
      <PopoverContent align={align}>
        <p className="text-caption text-muted-foreground">
          align="{align}" 로 정렬된 팝오버입니다.
        </p>
      </PopoverContent>
    </Popover>
  ))}
</div>`,
      },
    ],
  },
]
