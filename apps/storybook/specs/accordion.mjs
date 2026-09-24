export const specs = [
  {
    title: 'Accordion',
    slug: 'accordion',
    covers: ['accordion'],
    imports: [
      {
        from: '@comwit/ui-templates/accordion',
        names: ['Accordion', 'AccordionItem', 'AccordionTrigger', 'AccordionContent'],
      },
    ],
    stories: [
      {
        name: 'Faq',
        gallery: true,
        description:
          'type="single" collapsible — one answer open at a time, and it can be closed again.',
        render: `<Accordion type="single" collapsible defaultValue="trial" className="w-full max-w-md">
  <AccordionItem value="trial">
    <AccordionTrigger>Is there a free trial?</AccordionTrigger>
    <AccordionContent>Yes. Every workspace starts with 14 days of Pro, no card required.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="seats">
    <AccordionTrigger>Can I change my plan later?</AccordionTrigger>
    <AccordionContent>Upgrade or downgrade at any time. We prorate the difference on your next invoice.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="export">
    <AccordionTrigger>How do I export my data?</AccordionTrigger>
    <AccordionContent>Go to Settings, then Data, and download a CSV or JSON archive of your workspace.</AccordionContent>
  </AccordionItem>
</Accordion>`,
      },
      {
        name: 'Multiple',
        description:
          'type="multiple" lets several sections stay open. defaultValue takes an array.',
        render: `<Accordion type="multiple" defaultValue={['shipping', 'returns']} className="w-full max-w-md">
  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent>Orders ship within 2 business days. Tracking is emailed once the parcel leaves our warehouse.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent>Return unused items within 30 days for a full refund.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="warranty">
    <AccordionTrigger>Warranty</AccordionTrigger>
    <AccordionContent>Hardware is covered for one year against manufacturing defects.</AccordionContent>
  </AccordionItem>
</Accordion>`,
      },
      {
        name: 'DisabledItem',
        description: 'A disabled AccordionItem stays visible but cannot be opened.',
        render: `<Accordion type="single" collapsible className="w-full max-w-md">
  <AccordionItem value="profile">
    <AccordionTrigger>Profile</AccordionTrigger>
    <AccordionContent>Update your name, photo and time zone.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="sso" disabled>
    <AccordionTrigger>Single sign-on (Enterprise only)</AccordionTrigger>
    <AccordionContent>Connect Okta, Google Workspace or Azure AD.</AccordionContent>
  </AccordionItem>
</Accordion>`,
      },
    ],
  },
]
