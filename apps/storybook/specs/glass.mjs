export const specs = [
  {
    title: 'Glass',
    slug: 'glass',
    covers: ['glass'],
    imports: [{ from: '@comwit/ui-templates/glass', names: ['Glass', 'GlassButton'] }],
    extraImports: [`import { ChevronLeft, Heart, Plus } from 'lucide-react'`],
    stories: [
      {
        name: 'Variants',
        gallery: true,
        description: 'morphing · blur · frosted · fade over a photo',
        render: `<div className="grid w-full max-w-lg grid-cols-4 gap-3 rounded-card bg-[linear-gradient(135deg,#ffb86b_0%,#ff6a88_45%,#6a8dff_100%)] p-4">
  {(['morphing', 'blur', 'frosted', 'fade'] as const).map((variant) => (
    <div key={variant} className="relative isolate flex h-24 items-end rounded-card p-2.5">
      <Glass variant={variant} shape="panel" />
      <span className="relative z-raised text-caption font-semibold text-foreground">{variant}</span>
    </div>
  ))}
</div>`,
      },
      {
        name: 'Buttons',
        description: 'GlassButton — circle and pill, pressed with aria-pressed',
        render: `<div className="flex items-center gap-3 rounded-card bg-[linear-gradient(135deg,#9be7c4_0%,#5aa9ff_100%)] p-6">
  <GlassButton shape="circle" shadow={false} aria-label="Back" className="size-11">
    <ChevronLeft className="size-7" strokeWidth={2.5} />
  </GlassButton>
  <GlassButton shape="circle" aria-label="Like" aria-pressed className="size-11">
    <Heart className="size-5" />
  </GlassButton>
  <GlassButton className="h-11 px-5 text-label font-semibold">
    <Plus className="size-4" /> New
  </GlassButton>
</div>`,
      },
    ],
  },
]
