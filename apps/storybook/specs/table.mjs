export const specs = [
  {
    title: 'Table',
    slug: 'table',
    covers: ['table'],
    imports: [
      {
        from: '@comwit/ui-templates/table',
        names: [
          'Table',
          'TableHeader',
          'TableBody',
          'TableFooter',
          'TableHead',
          'TableRow',
          'TableCell',
          'TableCaption',
        ],
      },
    ],
    stories: [
      {
        name: 'Default',
        description: '헤더 + 3개 행으로 구성된 기본 테이블',
        render: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead>이름</TableHead>
      <TableHead>이메일</TableHead>
      <TableHead>상태</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>김철수</TableCell>
      <TableCell>chulsoo@burrr.ai</TableCell>
      <TableCell>활성</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>이영희</TableCell>
      <TableCell>younghee@burrr.ai</TableCell>
      <TableCell>대기</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>박민수</TableCell>
      <TableCell>minsoo@burrr.ai</TableCell>
      <TableCell>비활성</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
      },
      {
        name: 'WithCaptionAndFooter',
        description: 'TableCaption · TableFooter · 선택된 행(data-state)',
        render: `<Table>
  <TableCaption>2026년 상반기 결제 내역</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>항목</TableHead>
      <TableHead>방식</TableHead>
      <TableHead className="text-right">금액</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow data-state="selected">
      <TableCell>인보이스 001</TableCell>
      <TableCell>카드</TableCell>
      <TableCell className="text-right">120,000원</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>인보이스 002</TableCell>
      <TableCell>계좌이체</TableCell>
      <TableCell className="text-right">85,000원</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>인보이스 003</TableCell>
      <TableCell>카드</TableCell>
      <TableCell className="text-right">45,000원</TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>합계</TableCell>
      <TableCell className="text-right">250,000원</TableCell>
    </TableRow>
  </TableFooter>
</Table>`,
      },
    ],
  },
]
