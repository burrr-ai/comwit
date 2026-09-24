export const specs = [
  {
    title: 'InputGroup',
    slug: 'input-group',
    covers: ['input-group'],
    imports: [
      { from: '@comwit/ui-templates/input-group', names: ['InputGroup', 'InputAddon'] },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [`import { Search } from 'lucide-react'`],
    stories: [
      {
        name: 'SearchPrefix',
        description: '검색 아이콘 prefix',
        render: `<InputGroup className="w-72">
  <InputAddon><Search /></InputAddon>
  <Input placeholder="검색" />
</InputGroup>`,
      },
      {
        name: 'UnitPrefixSuffix',
        description: '단위 prefix(₩) · suffix(.00)',
        render: `<div className="space-y-4">
  <InputGroup className="w-72">
    <InputAddon>₩</InputAddon>
    <Input type="text" inputMode="numeric" placeholder="0" />
  </InputGroup>
  <InputGroup className="w-72">
    <InputAddon>₩</InputAddon>
    <Input type="text" inputMode="numeric" placeholder="0" />
    <InputAddon>.00</InputAddon>
  </InputGroup>
</div>`,
      },
      {
        name: 'TrailingButton',
        description: '뒤에 붙는 버튼',
        render: `<InputGroup className="w-80 pr-1">
  <Input placeholder="이메일 주소" />
  <InputAddon className="px-0">
    <Button size="sm">확인</Button>
  </InputAddon>
</InputGroup>`,
      },
      {
        name: 'Disabled',
        description: 'input:disabled 시 그룹 전체 흐려짐',
        render: `<InputGroup className="w-72">
  <InputAddon><Search /></InputAddon>
  <Input placeholder="검색" disabled />
</InputGroup>`,
      },
      {
        name: 'Invalid',
        description: 'aria-invalid 시 destructive 보더',
        render: `<InputGroup className="w-72">
  <InputAddon>₩</InputAddon>
  <Input type="text" inputMode="numeric" placeholder="0" aria-invalid defaultValue="-1000" />
</InputGroup>`,
      },
    ],
  },
]
