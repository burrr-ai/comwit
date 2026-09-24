export const specs = [
  {
    title: 'Tabs',
    slug: 'tabs',
    covers: ['tabs'],
    imports: [
      {
        from: '@comwit/ui-templates/tabs',
        names: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'],
      },
    ],
    stories: [
      {
        name: 'Default',
        description: 'defaultValue로 첫 탭 활성화 · 3개 탭 + 콘텐츠',
        render: `<Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">계정</TabsTrigger>
    <TabsTrigger value="password">비밀번호</TabsTrigger>
    <TabsTrigger value="notifications">알림</TabsTrigger>
  </TabsList>
  <TabsContent value="account" className="rounded-md border p-4 text-sm text-muted-foreground">
    계정 정보를 확인하고 프로필을 수정할 수 있습니다.
  </TabsContent>
  <TabsContent value="password" className="rounded-md border p-4 text-sm text-muted-foreground">
    비밀번호를 변경하려면 현재 비밀번호를 입력하세요.
  </TabsContent>
  <TabsContent value="notifications" className="rounded-md border p-4 text-sm text-muted-foreground">
    이메일 및 푸시 알림 수신 여부를 설정합니다.
  </TabsContent>
</Tabs>`,
      },
      {
        name: 'DisabledTab',
        description: '특정 탭 비활성화',
        render: `<Tabs defaultValue="general" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="general">일반</TabsTrigger>
    <TabsTrigger value="team">팀</TabsTrigger>
    <TabsTrigger value="billing" disabled>결제</TabsTrigger>
  </TabsList>
  <TabsContent value="general" className="rounded-md border p-4 text-sm text-muted-foreground">
    일반 설정입니다.
  </TabsContent>
  <TabsContent value="team" className="rounded-md border p-4 text-sm text-muted-foreground">
    팀 구성원을 관리합니다.
  </TabsContent>
  <TabsContent value="billing" className="rounded-md border p-4 text-sm text-muted-foreground">
    결제 정보입니다.
  </TabsContent>
</Tabs>`,
      },
    ],
  },
]
