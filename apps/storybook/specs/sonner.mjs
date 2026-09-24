export const specs = [
  {
    title: 'Toast',
    slug: 'sonner',
    covers: ['sonner'],
    // Toaster 는 preview.tsx 전역 데코레이터로 이미 마운트됨 — 여기선 버튼으로 toast() 만 트리거한다.
    imports: [{ from: '@comwit/ui-templates/button', names: ['Button'] }],
    extraImports: [`import { toast } from 'sonner'`],
    stories: [
      {
        name: 'Types',
        description: 'default · success · error · warning · info 토스트 트리거',
        render: `<div className="flex flex-wrap items-center gap-3">
  <Button variant="outline" onClick={() => toast('저장되었습니다')}>기본</Button>
  <Button variant="outline" onClick={() => toast.success('성공적으로 처리되었습니다')}>성공</Button>
  <Button variant="outline" onClick={() => toast.error('오류가 발생했습니다')}>오류</Button>
  <Button variant="outline" onClick={() => toast.warning('주의가 필요합니다')}>경고</Button>
  <Button variant="outline" onClick={() => toast.info('새로운 알림이 있습니다')}>정보</Button>
</div>`,
      },
      {
        name: 'WithDescription',
        description: '제목 + 설명(description)',
        render: `<Button
  variant="outline"
  onClick={() =>
    toast.success('파일이 업로드되었습니다', {
      description: '문서.pdf · 2.4MB · 방금 전',
    })
  }
>
  설명 있는 토스트
</Button>`,
      },
      {
        name: 'WithAction',
        description: '실행 취소 액션 버튼이 있는 토스트',
        render: `<Button
  variant="outline"
  onClick={() =>
    toast('항목이 삭제되었습니다', {
      action: { label: '실행 취소', onClick: () => toast.success('복원되었습니다') },
    })
  }
>
  액션 있는 토스트
</Button>`,
      },
    ],
  },
]
