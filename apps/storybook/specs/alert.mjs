export const specs = [
  {
    title: 'Alert',
    slug: 'alert',
    covers: ['alert'],
    // Token-only callout: docs example only, no Storybook story.
    docsOnly: true,
    imports: [
      { from: '@comwit/ui-templates/alert', names: ['Alert', 'AlertTitle', 'AlertDescription'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [
      `import { CircleCheck, CircleAlert, Info, Megaphone, TriangleAlert } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'A tinted callout: leading icon, title and description.',
        render: `<Alert tone="info" className="max-w-md">
  <Info />
  <div className="grid gap-1">
    <AlertTitle>Scheduled maintenance</AlertTitle>
    <AlertDescription>
      The dashboard will be read-only on Sunday from 2:00 to 3:00 AM UTC.
    </AlertDescription>
  </div>
</Alert>`,
      },
      {
        name: 'Tones',
        description: 'tone — default · success · warning · destructive · info.',
        render: `<div className="grid w-full max-w-md gap-3">
  <Alert>
    <Megaphone />
    <div className="grid gap-1">
      <AlertTitle>New: shared templates</AlertTitle>
      <AlertDescription>Save any project as a template for your team.</AlertDescription>
    </div>
  </Alert>
  <Alert tone="success">
    <CircleCheck />
    <div className="grid gap-1">
      <AlertTitle>Domain verified</AlertTitle>
      <AlertDescription>acme.com is now connected to your workspace.</AlertDescription>
    </div>
  </Alert>
  <Alert tone="warning">
    <TriangleAlert />
    <div className="grid gap-1">
      <AlertTitle>Your trial ends in 3 days</AlertTitle>
      <AlertDescription>Add a payment method to keep your projects running.</AlertDescription>
    </div>
  </Alert>
  <Alert tone="destructive">
    <CircleAlert />
    <div className="grid gap-1">
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>We couldn't charge the card ending in 4242.</AlertDescription>
    </div>
  </Alert>
  <Alert tone="info">
    <Info />
    <div className="grid gap-1">
      <AlertTitle>Read-only access</AlertTitle>
      <AlertDescription>Ask a workspace admin to request edit permissions.</AlertDescription>
    </div>
  </Alert>
</div>`,
      },
      {
        name: 'WithAction',
        description: 'Add an action next to the message when the reader can resolve it right away.',
        render: `<Alert tone="warning" className="max-w-lg items-center">
  <TriangleAlert />
  <div className="grid flex-1 gap-1">
    <AlertTitle>Billing details needed</AlertTitle>
    <AlertDescription>Update your card to avoid service interruption.</AlertDescription>
  </div>
  <Button size="sm" variant="outline">Update billing</Button>
</Alert>`,
      },
    ],
  },
]
