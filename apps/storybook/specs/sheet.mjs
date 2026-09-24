export const specs = [
  {
    title: 'Sheet',
    slug: 'sheet',
    covers: ['sheet'],
    imports: [
      {
        from: '@comwit/ui-templates/sheet',
        names: [
          'Sheet',
          'SheetTrigger',
          'SheetContent',
          'SheetHeader',
          'SheetFooter',
          'SheetTitle',
          'SheetDescription',
          'SheetClose',
        ],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    stories: [
      {
        name: 'Default',
        description: '트리거 · 헤더 · 푸터로 구성한 기본 시트',
        render: `<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">시트 열기</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>프로필 편집</SheetTitle>
      <SheetDescription>변경한 내용을 저장하려면 완료를 누르세요.</SheetDescription>
    </SheetHeader>
    <div className="px-4 text-body-sm text-muted-foreground">여기에 폼 내용을 배치합니다.</div>
    <SheetFooter>
      <Button>저장</Button>
      <SheetClose asChild>
        <Button variant="outline">취소</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
      },
      {
        name: 'Sides',
        description: 'side prop: top · right · bottom · left',
        render: `<div className="flex flex-wrap items-center gap-3">
  {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
    <Sheet key={side}>
      <SheetTrigger asChild>
        <Button variant="outline">{side}</Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>{side} 시트</SheetTitle>
          <SheetDescription>{side} 방향에서 열리는 시트입니다.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">닫기</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ))}
</div>`,
      },
    ],
  },
]
