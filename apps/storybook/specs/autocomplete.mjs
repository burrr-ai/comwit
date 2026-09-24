export const specs = [
  {
    title: 'Autocomplete',
    slug: 'autocomplete',
    covers: ['autocomplete'],
    // compound(React Aria) 컴포넌트 — meta.component 는 생략(타이핑 이슈 회피).
    imports: [
      { from: '@comwit/ui-templates/autocomplete', names: ['Autocomplete', 'AutocompleteItem'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `const FRUITS: [string, string][] = [
  ['apple', '사과'],
  ['banana', '바나나'],
  ['orange', '오렌지'],
  ['grape', '포도'],
  ['strawberry', '딸기'],
  ['watermelon', '수박'],
  ['peach', '복숭아'],
  ['mango', '망고'],
]`,
    ],
    stories: [
      {
        name: 'Default',
        description: '라벨 + 플레이스홀더 · 과일 목록에서 검색/선택(비제어)',
        render: `<div className="w-72">
  <Autocomplete
    label="과일"
    placeholder="과일 검색"
    onSelectionChange={(key) => console.log(key)}
  >
    {FRUITS.map(([key, name]) => (
      <AutocompleteItem key={key}>{name}</AutocompleteItem>
    ))}
  </Autocomplete>
</div>`,
      },
      {
        name: 'DefaultSelected',
        description: 'defaultSelectedKey 로 초기 선택값 지정(비제어)',
        render: `<div className="w-72">
  <Autocomplete label="과일" placeholder="과일 검색" defaultSelectedKey="banana">
    {FRUITS.map(([key, name]) => (
      <AutocompleteItem key={key}>{name}</AutocompleteItem>
    ))}
  </Autocomplete>
</div>`,
      },
      {
        name: 'Disabled',
        description: 'isDisabled — 전체 필드 비활성',
        render: `<div className="w-72">
  <Autocomplete label="과일" placeholder="과일 검색" isDisabled defaultSelectedKey="apple">
    {FRUITS.map(([key, name]) => (
      <AutocompleteItem key={key}>{name}</AutocompleteItem>
    ))}
  </Autocomplete>
</div>`,
      },
      {
        name: 'Controlled',
        description: 'selectedKey + onSelectionChange 로 제어',
        renderFn: `const [selected, setSelected] = React.useState<string | number | null>('apple')
return (
  <div className="w-72 space-y-2">
    <Autocomplete
      label="과일"
      placeholder="과일 검색"
      selectedKey={selected}
      onSelectionChange={(key) => setSelected(key)}
    >
      {FRUITS.map(([key, name]) => (
        <AutocompleteItem key={key}>{name}</AutocompleteItem>
      ))}
    </Autocomplete>
    <p className="text-caption text-muted-foreground">선택된 키: {String(selected ?? '없음')}</p>
  </div>
)`,
      },
    ],
  },
]
