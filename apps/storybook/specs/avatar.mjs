export const specs = [
  {
    title: 'Avatar',
    slug: 'avatar',
    covers: ['avatar'],
    // 컴포넌드(Avatar/AvatarImage/AvatarFallback) → meta.component 생략
    imports: [
      {
        from: '@comwit/ui-templates/avatar',
        names: ['Avatar', 'AvatarImage', 'AvatarFallback'],
      },
    ],
    stories: [
      {
        name: 'WithImage',
        description:
          '이미지 로드 시 AvatarImage, 실패 시 AvatarFallback 노출 (SB 정적 빌드에서 외부 URL 차단 → 자체 data URI 사용)',
        render: `<div className="flex items-center gap-4">
  <Avatar>
    <AvatarImage
      src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='%234f46e5'/><text x='20' y='26' font-size='16' fill='%23ffffff' text-anchor='middle' font-family='sans-serif'>CW</text></svg>"
      alt="사용자 프로필"
    />
    <AvatarFallback>CW</AvatarFallback>
  </Avatar>
  <span className="text-sm text-muted-foreground">이미지 있음</span>
</div>`,
      },
      {
        name: 'Fallback',
        description: '이미지 없이 이니셜만 표시',
        render: `<div className="flex items-center gap-4">
  <Avatar>
    <AvatarFallback>CW</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarFallback>홍</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarFallback>AI</AvatarFallback>
  </Avatar>
</div>`,
      },
      {
        name: 'Sizes',
        description: 'size 프롭 없음 → className 유틸(size-*)로 크기 조절 (기본 size-8)',
        render: `<div className="flex items-center gap-4">
  {(['size-6', 'size-8', 'size-10', 'size-12'] as const).map((s) => (
    <Avatar key={s} className={s}>
      <AvatarFallback>CW</AvatarFallback>
    </Avatar>
  ))}
</div>`,
      },
      {
        name: 'Group',
        description: '겹쳐 쌓은 아바타 그룹',
        render: `<div className="flex -space-x-2">
  {(['CW', '홍', 'AI', '문'] as const).map((label) => (
    <Avatar key={label} className="ring-2 ring-background">
      <AvatarFallback>{label}</AvatarFallback>
    </Avatar>
  ))}
</div>`,
      },
    ],
  },
]
