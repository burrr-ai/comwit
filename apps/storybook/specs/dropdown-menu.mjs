export const specs = [
  {
    title: 'DropdownMenu',
    slug: 'dropdown-menu',
    covers: ['dropdown-menu'],
    imports: [
      {
        from: '@comwit/ui-templates/dropdown-menu',
        names: [
          'DropdownMenu',
          'DropdownMenuTrigger',
          'DropdownMenuContent',
          'DropdownMenuGroup',
          'DropdownMenuLabel',
          'DropdownMenuItem',
          'DropdownMenuCheckboxItem',
          'DropdownMenuRadioGroup',
          'DropdownMenuRadioItem',
          'DropdownMenuSeparator',
          'DropdownMenuShortcut',
          'DropdownMenuSub',
          'DropdownMenuSubTrigger',
          'DropdownMenuSubContent',
        ],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { User, Settings, LogOut, Mail, MessageSquare, Plus, Trash2 } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Default',
        description: 'label · group · item(shortcut) · separator · destructive',
        render: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">메뉴 열기</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56">
    <DropdownMenuLabel>내 계정</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <User />
        프로필
        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings />
        설정
        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">
      <LogOut />
      로그아웃
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      },
      {
        name: 'CheckboxItems',
        description: 'DropdownMenuCheckboxItem 을 useState 로 제어',
        renderFn: `const [showStatus, setShowStatus] = React.useState(true)
const [showActivity, setShowActivity] = React.useState(false)
return (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">보기 옵션</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56">
      <DropdownMenuLabel>패널 표시</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        checked={showStatus}
        onCheckedChange={(v) => setShowStatus(Boolean(v))}
      >
        상태 표시줄
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={showActivity}
        onCheckedChange={(v) => setShowActivity(Boolean(v))}
      >
        활동 표시줄
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked disabled>
        알림 표시줄
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
)`,
      },
      {
        name: 'RadioGroup',
        description: 'DropdownMenuRadioGroup 으로 단일 선택',
        renderFn: `const [position, setPosition] = React.useState('top')
return (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">위치 선택</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56">
      <DropdownMenuLabel>패널 위치</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
        <DropdownMenuRadioItem value="top">위</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="bottom">아래</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="right">오른쪽</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
)`,
      },
      {
        name: 'Submenu',
        description: 'DropdownMenuSub 로 중첩 메뉴 구성',
        render: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">더 보기</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56">
    <DropdownMenuItem>
      <Plus />
      새 파일
    </DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>공유</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>
          <Mail />
          이메일
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MessageSquare />
          메시지
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>더 보기...</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">
      <Trash2 />
      삭제
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      },
    ],
  },
]
