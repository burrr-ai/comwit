export const specs = [
  {
    title: 'Card',
    slug: 'card',
    covers: ['card'],
    docsOnly: true,
    imports: [
      {
        from: '@comwit/ui-templates/card',
        names: [
          'Card',
          'CardHeader',
          'CardTitle',
          'CardDescription',
          'CardAction',
          'CardContent',
          'CardFooter',
        ],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
      { from: '@comwit/ui-templates/badge', names: ['Badge'] },
    ],
    stories: [
      {
        name: 'Plan',
        gallery: true,
        description: 'Header with a CardAction badge, a single key figure and one call to action.',
        render: `<Card className="w-72 gap-4 py-5">
  <CardHeader className="px-5">
    <CardTitle>Pro plan</CardTitle>
    <CardDescription>For growing teams</CardDescription>
    <CardAction>
      <Badge variant="info">Popular</Badge>
    </CardAction>
  </CardHeader>
  <CardContent className="px-5">
    <p className="text-display-sm text-foreground">
      $24<span className="text-body-sm text-soft-foreground"> / seat / month</span>
    </p>
  </CardContent>
  <CardFooter className="px-5">
    <Button className="w-full">Upgrade to Pro</Button>
  </CardFooter>
</Card>`,
      },
      {
        name: 'Default',
        description: 'CardHeader · CardContent · CardFooter with a primary and a secondary action.',
        render: `<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Invite teammates</CardTitle>
    <CardDescription>They will get an email with a link to join your workspace.</CardDescription>
  </CardHeader>
  <CardContent className="text-body-sm text-soft-foreground">
    You have 3 of 10 seats left on the Pro plan.
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="ghost">Cancel</Button>
    <Button>Send invites</Button>
  </CardFooter>
</Card>`,
      },
      {
        name: 'WithAction',
        description: 'CardAction pins a control to the top-right corner of the header.',
        render: `<Card className="w-full max-w-sm">
  <CardHeader className="border-b">
    <CardTitle>Billing address</CardTitle>
    <CardDescription>Used on every invoice.</CardDescription>
    <CardAction>
      <Button size="sm" variant="outline">Edit</Button>
    </CardAction>
  </CardHeader>
  <CardContent className="grid gap-1 text-body-sm text-foreground">
    <p>Acme Inc.</p>
    <p className="text-soft-foreground">500 Howard Street, San Francisco, CA 94105</p>
  </CardContent>
</Card>`,
      },
    ],
  },
]
