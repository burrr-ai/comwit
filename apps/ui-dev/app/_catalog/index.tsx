'use client'

import * as React from 'react'
import { toast } from '@comwit/ui-templates/toast'
import {
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  InfoIcon,
  SearchIcon,
  PlusIcon,
} from '@comwit/ui/icons'

import { popup } from '@comwit/ui-templates/lib/popup'
import { Button } from '@comwit/ui-templates/button'
import { Chip } from '@comwit/ui-templates/chip'
import { Badge } from '@comwit/ui-templates/badge'
import { Input } from '@comwit/ui-templates/input'
import { InputGroup, InputAddon } from '@comwit/ui-templates/input-group'
import { Textarea } from '@comwit/ui-templates/textarea'
import { TextField } from '@comwit/ui-templates/text-field'
import { Label } from '@comwit/ui-templates/label'
import { Checkbox } from '@comwit/ui-templates/checkbox'
import { RadioGroup, RadioGroupItem } from '@comwit/ui-templates/radio-group'
import { Switch } from '@comwit/ui-templates/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@comwit/ui-templates/select'
import { Autocomplete, AutocompleteItem } from '@comwit/ui-templates/autocomplete'
import { Calendar } from '@comwit/ui-templates/calendar'
import { DatePicker } from '@comwit/ui-templates/date-picker'
import { TimePicker } from '@comwit/ui-templates/time-picker'
import { MonthPicker } from '@comwit/ui-templates/month-picker'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@comwit/ui-templates/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@comwit/ui-templates/accordion'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@comwit/ui-templates/dialog'
import { Separator } from '@comwit/ui-templates/separator'

import { CatalogSection, GroupLabel } from './section'
import { MainPagePreview } from './main-preview'
import { DataTableDemo } from './data-table-demo'
import { Foundations } from './foundations'
import { OverrideLab, OverrideLabControls } from './override-lab'

/* Demonstrate all five status tokens: solid/on-solid in the header, surface/on-surface/border in the body. */
const STATUS_ANATOMY = [
  {
    key: 'success',
    solid: 'bg-success text-success-foreground',
    surface: 'border-success-border bg-success-surface',
    fg: 'text-success-surface-foreground',
    hex: '#30a46c · sf #e6f6eb · fg #1c7549 · bd #8eceaa',
  },
  {
    key: 'info',
    solid: 'bg-info text-info-foreground',
    surface: 'border-info-border bg-info-surface',
    fg: 'text-info-surface-foreground',
    hex: '#0090ff · sf #e6f4fe · fg #0b68ba · bd #8ec8f6',
  },
  {
    key: 'warning',
    solid: 'bg-warning text-warning-foreground',
    surface: 'border-warning-border bg-warning-surface',
    fg: 'text-warning-surface-foreground',
    hex: '#f76b15 · sf #ffefd6 · fg #b54500 · bd #f5ae73',
  },
  {
    key: 'destructive',
    solid: 'bg-destructive text-destructive-foreground',
    surface: 'border-destructive-border bg-destructive-surface',
    fg: 'text-destructive-surface-foreground',
    hex: '#e5484d · sf #feebec · fg #c62a2f · bd #f4a9aa',
  },
] as const

const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const

/* Callout: surface background, border, on-surface text, and a solid icon from the same status family. */
const CALLOUTS = [
  {
    tone: 'success',
    wrap: 'border-success-border bg-success-surface',
    icon: 'text-success',
    fg: 'text-success-surface-foreground',
    Icon: CheckCircle2Icon,
    title: 'Completed',
    body: 'The operation completed successfully.',
  },
  {
    tone: 'info',
    wrap: 'border-info-border bg-info-surface',
    icon: 'text-info',
    fg: 'text-info-surface-foreground',
    Icon: InfoIcon,
    title: 'Information',
    body: 'Useful information appears here.',
  },
  {
    tone: 'warning',
    wrap: 'border-warning-border bg-warning-surface',
    icon: 'text-warning',
    fg: 'text-warning-surface-foreground',
    Icon: AlertTriangleIcon,
    title: 'Attention required',
    body: 'Some items need your review.',
  },
  {
    tone: 'destructive',
    wrap: 'border-destructive-border bg-destructive-surface',
    icon: 'text-destructive',
    fg: 'text-destructive-surface-foreground',
    Icon: XCircleIcon,
    title: 'Something went wrong',
    body: 'Please try again.',
  },
] as const

const FILLED_CALLOUTS = [
  {
    tone: 'success',
    wrap: 'bg-success text-success-foreground',
    Icon: CheckCircle2Icon,
    title: 'Saved',
  },
  {
    tone: 'warning',
    wrap: 'bg-warning text-warning-foreground',
    Icon: AlertTriangleIcon,
    title: 'Storage is almost full',
  },
  {
    tone: 'destructive',
    wrap: 'bg-destructive text-destructive-foreground',
    Icon: XCircleIcon,
    title: 'Could not delete',
  },
  {
    tone: 'info',
    wrap: 'bg-info text-info-foreground',
    Icon: InfoIcon,
    title: 'A new version is available',
  },
] as const

const CHIP_TONES = ['neutral', 'brand', 'success', 'warning', 'destructive', 'info'] as const

const FRUITS: [string, string][] = [
  ['apple', 'Apple'],
  ['banana', 'Banana'],
  ['cherry', 'Cherry'],
  ['grape', 'Grape'],
  ['mango', 'Mango'],
  ['orange', 'Orange'],
  ['peach', 'Peach'],
  ['strawberry', 'Strawberry'],
  ['watermelon', 'Watermelon'],
]

/* Helpers. */

const NAV: [string, string][] = [
  ['overview', 'Overview'],
  ['foundations', 'Foundations'],
  ['status', 'Status'],
  ['buttons', 'Buttons'],
  ['chips', 'Chips'],
  ['form', 'Form'],
  ['date', 'Date'],
  ['disclosure', 'Disclosure'],
  ['data', 'Data'],
  ['feedback', 'Feedback'],
  ['elevation', 'Elevation'],
]

/* Catalog. */

export function DesignSystemCatalog() {
  const [date, setDate] = React.useState('')
  const [time, setTime] = React.useState('')
  const [month, setMonth] = React.useState('')
  const [day, setDay] = React.useState<Date | undefined>(undefined)
  const [filter, setFilter] = React.useState('All')
  const [tags, setTags] = React.useState(['Design', 'Tokens', 'Components'])
  const [floatName, setFloatName] = React.useState('Alex Token')
  const [floatEmail, setFloatEmail] = React.useState('')
  const [floatBio, setFloatBio] = React.useState('')
  const [fruit, setFruit] = React.useState<React.Key | null>(null)

  return (
    /*
     * Override Lab wraps every section. Inline CSS variables restyle the whole page, just like consumer overrides on :root.
     */
    <OverrideLab>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex max-w-6xl gap-12 px-6 py-14">
          <aside className="sticky top-14 hidden h-fit w-40 shrink-0 lg:block">
            <p className="mb-4 text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Design System
            </p>
            <nav className="flex flex-col gap-1 text-body-sm">
              {NAV.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 space-y-4">
            <header className="pb-6">
              <h1 className="text-display-lg text-foreground">Design system</h1>
            </header>

            <CatalogSection index="00" eyebrow="Overview" title="Main page preview">
              <MainPagePreview />
            </CatalogSection>

            <CatalogSection
              index="01"
              eyebrow="Foundations"
              title="Design tokens"
              desc="Colors, radii, borders, elevation, typography, motion, and state all use tokens. Adjust the controls below to override :root values and restyle every component on this page without editing component code."
            >
              <div className="space-y-12">
                <OverrideLabControls />
                <Foundations />
              </div>
            </CatalogSection>

            <CatalogSection index="02" eyebrow="Status" title="Status palette">
              <div className="space-y-10">
                {/* Each card demonstrates all five status tokens in their intended roles. */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {STATUS_ANATOMY.map((s) => (
                    <div
                      key={s.key}
                      className={`overflow-hidden rounded-lg border ${s.surface.split(' ')[0]}`}
                    >
                      <div className={`px-4 py-3 ${s.solid}`}>
                        <p className="text-title-sm">{s.key}</p>
                        <p className="font-mono text-caption">
                          bg-{s.key} + text-{s.key}-foreground
                        </p>
                      </div>
                      <div className={`border-t p-4 ${s.surface}`}>
                        <p className={`text-title-sm ${s.fg}`}>
                          Surface text uses a darker tone from the same color family
                        </p>
                        <p className={`mt-0.5 text-body-sm ${s.fg}`}>
                          bg-{s.key}-surface · text-{s.key}-surface-foreground · border-{s.key}
                          -border
                        </p>
                        <p className={`mt-2 font-mono text-caption ${s.fg}`}>{s.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <GroupLabel>Callouts</GroupLabel>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {CALLOUTS.map((c) => (
                      <div key={c.tone} className={`flex gap-3 rounded-lg border p-4 ${c.wrap}`}>
                        <c.Icon className={`mt-0.5 size-5 shrink-0 ${c.icon}`} />
                        <div className="min-w-0">
                          <p className={`text-title-sm ${c.fg}`}>{c.title}</p>
                          <p className={`mt-0.5 text-body-sm ${c.fg}`}>{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Chip callout: solid chip with inline body text. */}
                  <div className="mt-4 flex items-center gap-3 rounded-lg border border-warning-border bg-warning-surface px-4 py-3">
                    <span className="shrink-0 rounded-md bg-warning px-2 py-0.5 text-caption font-semibold text-warning-foreground">
                      Tip
                    </span>
                    <p className="min-w-0 text-body-sm text-warning-surface-foreground">
                      See the{' '}
                      <a href="#status" className="font-medium underline underline-offset-2">
                        design guide
                      </a>
                      for detailed usage.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {FILLED_CALLOUTS.map((c) => (
                      <div
                        key={c.tone}
                        className={`flex items-center gap-3 rounded-lg p-4 ${c.wrap}`}
                      >
                        <c.Icon className="size-5 shrink-0" />
                        <p className="text-title-sm">{c.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <GroupLabel>Chip tones</GroupLabel>
                  <div className="flex flex-wrap gap-2">
                    {CHIP_TONES.map((tone) => (
                      <Chip key={tone} tone={tone}>
                        {tone}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="04" eyebrow="Buttons" title="Buttons">
              <div className="space-y-6 rounded-lg border border-border p-6">
                <div className="flex flex-wrap items-center gap-3">
                  {BUTTON_VARIANTS.map((v) => (
                    <Button key={v} variant={v}>
                      {v}
                    </Button>
                  ))}
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">sm</Button>
                  <Button>default</Button>
                  <Button size="lg">lg</Button>
                  <Button size="icon" variant="outline" aria-label="Search">
                    <SearchIcon />
                  </Button>
                  <Button className="rounded-pill px-5">pill</Button>
                  <Button disabled>disabled</Button>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="05" eyebrow="Chips" title="Chips">
              <div className="space-y-6 rounded-lg border border-border p-6">
                {(['soft', 'solid', 'outline'] as const).map((variant) => (
                  <div key={variant} className="flex flex-wrap items-center gap-2">
                    <span className="w-14 shrink-0 font-mono text-caption text-muted-foreground">
                      {variant}
                    </span>
                    {CHIP_TONES.map((tone) => (
                      <Chip key={tone} variant={variant} tone={tone}>
                        {tone}
                      </Chip>
                    ))}
                  </div>
                ))}
                <Separator />
                <div className="flex flex-wrap items-center gap-2">
                  {['All', 'Popular', 'New'].map((f) => (
                    <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
                      {f}
                    </Chip>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((t) => (
                    <Chip
                      key={t}
                      variant="outline"
                      onDelete={() => setTags(tags.filter((x) => x !== t))}
                    >
                      {t}
                    </Chip>
                  ))}
                  {tags.length < 3 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTags(['Design', 'Tokens', 'Components'])}
                    >
                      <PlusIcon /> Reset
                    </Button>
                  ) : null}
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-14 shrink-0 font-mono text-caption text-muted-foreground">
                    badge
                  </span>
                  <Badge>default</Badge>
                  <Badge variant="secondary">secondary</Badge>
                  <Badge variant="destructive">destructive</Badge>
                  <Badge variant="outline">outline</Badge>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="06" eyebrow="Form" title="Input and selection controls">
              <div className="grid gap-6 rounded-lg border border-border p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ds-input">Input</Label>
                  <Input id="ds-input" placeholder="Enter text" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-input-invalid">Input · invalid</Label>
                  <Input id="ds-input-invalid" aria-invalid placeholder="Error state" />
                </div>
                <div className="space-y-2">
                  <Label>InputGroup · Search</Label>
                  <InputGroup>
                    <InputAddon>
                      <SearchIcon />
                    </InputAddon>
                    <Input placeholder="Search query" />
                  </InputGroup>
                </div>
                <div className="space-y-2">
                  <Label>InputGroup · Unit</Label>
                  <InputGroup>
                    <InputAddon>₩</InputAddon>
                    <Input placeholder="0" inputMode="numeric" />
                    <InputAddon>.00</InputAddon>
                  </InputGroup>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>InputGroup · Button</Label>
                  <InputGroup>
                    <Input placeholder="Email address" type="email" />
                    <Button size="sm" className="mr-1">
                      Subscribe
                    </Button>
                  </InputGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-select">Select</Label>
                  <Select>
                    <SelectTrigger id="ds-select">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Option A</SelectItem>
                      <SelectItem value="b">Option B</SelectItem>
                      <SelectItem value="c">Option C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-textarea">Textarea</Label>
                  <Textarea id="ds-textarea" placeholder="Multiline input" />
                </div>
                <div className="space-y-3">
                  <Label>Checkbox</Label>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox id="ds-check" defaultChecked />
                      <Label htmlFor="ds-check" className="font-normal">
                        I agree
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="ds-check-d" disabled />
                      <Label htmlFor="ds-check-d" className="font-normal text-muted-foreground">
                        Disabled
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Radio</Label>
                  <RadioGroup defaultValue="one" className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="one" id="ds-r1" />
                      <Label htmlFor="ds-r1" className="font-normal">
                        One
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="two" id="ds-r2" />
                      <Label htmlFor="ds-r2" className="font-normal">
                        Two
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label>Switch</Label>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch id="ds-sw" defaultChecked />
                      <Label htmlFor="ds-sw" className="font-normal">
                        Receive notifications
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="ds-sw-sm" size="sm" />
                      <Label htmlFor="ds-sw-sm" className="font-normal">
                        Small
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="ds-sw-d" disabled defaultChecked />
                      <Label htmlFor="ds-sw-d" className="font-normal text-muted-foreground">
                        Disabled
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Autocomplete uses React Aria for filtering, keyboard navigation, and selection indicators. */}
              <div className="mt-10">
                <GroupLabel>Autocomplete · Search and select</GroupLabel>
                <div className="grid gap-6 rounded-lg border border-border p-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Autocomplete
                      label="Favorite fruit"
                      placeholder="Search fruit…"
                      onSelectionChange={setFruit}
                    >
                      {FRUITS.map(([key, name]) => (
                        <AutocompleteItem key={key}>{name}</AutocompleteItem>
                      ))}
                    </Autocomplete>
                    <p className="text-caption text-muted-foreground">
                      Selected: {fruit ? FRUITS.find(([k]) => k === fruit)?.[1] : 'None'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Autocomplete
                      label="City"
                      placeholder="Type to filter…"
                      defaultSelectedKey="seoul"
                    >
                      {[
                        ['seoul', 'Seoul'],
                        ['busan', 'Busan'],
                        ['incheon', 'Incheon'],
                        ['daegu', 'Daegu'],
                        ['gwangju', 'Gwangju'],
                        ['daejeon', 'Daejeon'],
                      ].map(([key, name]) => (
                        <AutocompleteItem key={key}>{name}</AutocompleteItem>
                      ))}
                    </Autocomplete>
                  </div>
                </div>
              </div>

              {/* TextField uses a fixed outlined label. The primitive wires labels, controls, descriptions, and errors. */}
              <div className="mt-10 space-y-8">
                <div>
                  <GroupLabel>TextField</GroupLabel>
                  <div className="grid gap-6 rounded-lg border border-border p-6 md:grid-cols-3">
                    <TextField label="Name" helperText="Enter your legal name">
                      <Input value={floatName} onChange={(e) => setFloatName(e.target.value)} />
                    </TextField>
                    <TextField label="Email" required helperText="Work email">
                      <Input
                        type="email"
                        value={floatEmail}
                        onChange={(e) => setFloatEmail(e.target.value)}
                      />
                    </TextField>
                    <TextField label="Company" error="This field is required">
                      <Input aria-invalid />
                    </TextField>
                    <TextField label="About you" className="md:col-span-2">
                      <Textarea value={floatBio} onChange={(e) => setFloatBio(e.target.value)} />
                    </TextField>
                    <TextField label="Username" disabled helperText="Cannot be changed">
                      <Input defaultValue="token_user" disabled />
                    </TextField>
                  </div>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="07" eyebrow="Date" title="Date and time">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-border p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>DatePicker</Label>
                      <DatePicker value={date} onChange={setDate} placeholder="Date" />
                    </div>
                    <div className="space-y-2">
                      <Label>TimePicker</Label>
                      <TimePicker value={time} onChange={setTime} placeholder="Time" />
                    </div>
                    <div className="space-y-2">
                      <Label>MonthPicker</Label>
                      <MonthPicker value={month} onChange={setMonth} placeholder="Month" />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-6">
                  <Label className="mb-3 block">Calendar</Label>
                  <Calendar mode="single" selected={day} onSelect={setDay} />
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="08" eyebrow="Disclosure" title="Tabs and accordion">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-border p-6">
                  <Tabs defaultValue="t1">
                    <TabsList>
                      <TabsTrigger value="t1">Overview</TabsTrigger>
                      <TabsTrigger value="t2">Details</TabsTrigger>
                      <TabsTrigger value="t3">Reviews</TabsTrigger>
                    </TabsList>
                    <TabsContent value="t1" className="pt-4 text-body-sm text-muted-foreground">
                      Overview content
                    </TabsContent>
                    <TabsContent value="t2" className="pt-4 text-body-sm text-muted-foreground">
                      Detail content
                    </TabsContent>
                    <TabsContent value="t3" className="pt-4 text-body-sm text-muted-foreground">
                      Review content
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="rounded-lg border border-border p-6">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="a1">
                      <AccordionTrigger>First item</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        This is the expanded content area.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="a2">
                      <AccordionTrigger>Second item</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        This is another content area.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection
              index="09"
              eyebrow="Data"
              title="Data table"
              desc="Server-side pagination with TanStack Table. Initial loading uses skeletons, refetching shows a top-right spinner, and partial pages are padded with empty rows to maintain height."
            >
              <DataTableDemo />
            </CatalogSection>

            <CatalogSection index="10" eyebrow="Feedback" title="Dialogs and toasts">
              <div className="space-y-6 rounded-lg border border-border p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Open dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Dialog title</DialogTitle>
                        <DialogDescription>
                          Descriptive text for the modal content.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button>Confirm</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const ok = await popup.confirm({ description: 'Continue with this action?' })
                      toast(ok ? 'Confirmed' : 'Canceled')
                    }}
                  >
                    popup.confirm
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => popup.alert({ description: 'The operation is complete.' })}
                  >
                    popup.alert
                  </Button>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  {/* Override status colors through className without adding variants; cn/twMerge applies status tokens over ghost. */}
                  <Button variant="outline" size="sm" onClick={() => toast('Link copied')}>
                    Default
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => toast.success('Success')}
                  >
                    success
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => toast.error('An error occurred')}
                  >
                    error
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-warning text-warning-foreground hover:bg-warning/90"
                    onClick={() => toast.warning('Attention required')}
                  >
                    warning
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-info text-info-foreground hover:bg-info/90"
                    onClick={() => toast.info('For your information')}
                  >
                    info
                  </Button>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="11" eyebrow="Elevation" title="Shadows and corners">
              <div className="grid gap-6 sm:grid-cols-2">
                <div
                  className="flex h-24 items-center justify-center rounded-lg bg-card text-caption text-muted-foreground"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  shadow-card
                </div>
                <div
                  className="flex h-24 items-center justify-center rounded-lg bg-card text-caption text-muted-foreground"
                  style={{ boxShadow: 'var(--shadow-card-hover)' }}
                >
                  shadow-card-hover
                </div>
              </div>
              <Separator className="my-8" />
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-16 rounded-lg border border-border bg-muted" />
                  <span className="font-mono text-caption text-muted-foreground">rounded-lg</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-16 rounded-pill border border-border bg-muted" />
                  <span className="font-mono text-caption text-muted-foreground">rounded-pill</span>
                </div>
              </div>
            </CatalogSection>
          </main>
        </div>
      </div>
    </OverrideLab>
  )
}
