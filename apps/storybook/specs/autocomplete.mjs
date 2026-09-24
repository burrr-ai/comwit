export const specs = [
  {
    title: 'Autocomplete',
    slug: 'autocomplete',
    covers: ['autocomplete'],
    // Compound (React Aria) component — meta.component is omitted to avoid typing issues.
    imports: [
      { from: '@comwit/ui-templates/autocomplete', names: ['Autocomplete', 'AutocompleteItem'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `const COUNTRIES: [string, string][] = [
  ['au', 'Australia'],
  ['br', 'Brazil'],
  ['ca', 'Canada'],
  ['fr', 'France'],
  ['de', 'Germany'],
  ['in', 'India'],
  ['jp', 'Japan'],
  ['kr', 'South Korea'],
  ['gb', 'United Kingdom'],
  ['us', 'United States'],
]`,
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Type to filter the list, then pick with the mouse or keyboard',
        render: `<div className="w-full max-w-xs">
  <Autocomplete label="Country" placeholder="Search countries">
    {COUNTRIES.map(([key, name]) => (
      <AutocompleteItem key={key}>{name}</AutocompleteItem>
    ))}
  </Autocomplete>
</div>`,
      },
      {
        name: 'EmptyText',
        description: 'emptyText is shown when nothing matches the query',
        render: `<div className="w-full max-w-xs">
  <Autocomplete
    label="Country"
    placeholder="Try typing Atlantis"
    emptyText="No countries match your search"
  >
    {COUNTRIES.map(([key, name]) => (
      <AutocompleteItem key={key}>{name}</AutocompleteItem>
    ))}
  </Autocomplete>
</div>`,
      },
      {
        name: 'States',
        description: 'isInvalid and isDisabled',
        render: `<div className="grid w-full max-w-xs gap-4">
  <Autocomplete label="Shipping country" placeholder="Search countries" isInvalid>
    {COUNTRIES.map(([key, name]) => (
      <AutocompleteItem key={key}>{name}</AutocompleteItem>
    ))}
  </Autocomplete>
  <Autocomplete label="Billing country" isDisabled defaultSelectedKey="us">
    {COUNTRIES.map(([key, name]) => (
      <AutocompleteItem key={key}>{name}</AutocompleteItem>
    ))}
  </Autocomplete>
</div>`,
      },
      {
        name: 'Controlled',
        description: 'selectedKey and onSelectionChange',
        renderFn: `const [country, setCountry] = React.useState<string | number | null>('jp')
return (
  <div className="grid w-full max-w-xs gap-2">
    <Autocomplete
      label="Country"
      placeholder="Search countries"
      selectedKey={country}
      onSelectionChange={setCountry}
    >
      {COUNTRIES.map(([key, name]) => (
        <AutocompleteItem key={key}>{name}</AutocompleteItem>
      ))}
    </Autocomplete>
    <p className="text-caption text-muted-foreground">Selected key: {String(country ?? 'none')}</p>
  </div>
)`,
      },
    ],
  },
]
