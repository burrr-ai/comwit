export const specs = [
  {
    title: 'Dialog',
    slug: 'dialog',
    covers: ['dialog'],
    imports: [
      {
        from: '@comwit/ui-templates/dialog',
        names: [
          'Dialog',
          'DialogTrigger',
          'DialogContent',
          'DialogHeader',
          'DialogTitle',
          'DialogDescription',
          'DialogFooter',
          'DialogClose',
        ],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    stories: [
      {
        name: 'Default',
        description: '트리거 버튼으로 여는 기본 다이얼로그',
        render: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">프로필 수정</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>프로필 수정</DialogTitle>
      <DialogDescription>
        계정 정보를 변경합니다. 완료되면 저장을 눌러주세요.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">취소</Button>
      </DialogClose>
      <Button>저장</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
      },
      {
        name: 'Destructive',
        description: '확인/취소가 있는 삭제 확인 다이얼로그',
        render: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">계정 삭제</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>정말 삭제하시겠어요?</DialogTitle>
      <DialogDescription>
        이 작업은 되돌릴 수 없습니다. 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">취소</Button>
      </DialogClose>
      <DialogClose asChild>
        <Button variant="destructive">삭제</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
      },
      {
        name: 'WithoutCloseButton',
        description: 'showCloseButton={false} — 우측 상단 X 버튼 숨김',
        render: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="secondary">약관 보기</Button>
  </DialogTrigger>
  <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>서비스 이용약관</DialogTitle>
      <DialogDescription>
        계속하려면 아래 약관에 동의해 주세요.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button className="w-full">동의합니다</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
      },
    ],
  },
]
