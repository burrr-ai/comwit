export const specs = [
  {
    title: 'Table',
    slug: 'table',
    covers: ['table'],
    imports: [
      {
        from: '@comwit/ui-templates/table',
        names: [
          'Table',
          'TableHeader',
          'TableBody',
          'TableFooter',
          'TableHead',
          'TableRow',
          'TableCell',
          'TableCaption',
        ],
      },
      { from: '@comwit/ui-templates/badge', names: ['Badge'] },
    ],
    stories: [
      {
        name: 'Members',
        gallery: true,
        description: 'Muted header row, hover highlight and status badges.',
        render: `<div className="w-full max-w-lg">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Role</TableHead>
        <TableHead className="text-right">Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {([
        { name: 'Ava Chen', email: 'ava@acme.dev', role: 'Owner', status: 'Active' },
        { name: 'Liam Patel', email: 'liam@acme.dev', role: 'Admin', status: 'Active' },
        { name: 'Sofia Rossi', email: 'sofia@acme.dev', role: 'Editor', status: 'Invited' },
      ] as const).map((member) => (
        <TableRow key={member.email}>
          <TableCell>
            <p className="font-semibold text-foreground">{member.name}</p>
            <p className="text-caption text-soft-foreground">{member.email}</p>
          </TableCell>
          <TableCell>{member.role}</TableCell>
          <TableCell className="text-right">
            <Badge variant={member.status === 'Active' ? 'success' : 'warning'}>{member.status}</Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>`,
      },
      {
        name: 'Invoices',
        description: 'TableCaption, TableFooter and a selected row (data-state="selected").',
        render: `<Table>
  <TableCaption>Invoices for the first half of 2026</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Method</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow data-state="selected">
      <TableCell>INV-001</TableCell>
      <TableCell>Credit card</TableCell>
      <TableCell className="text-right tabular-nums">$250.00</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>INV-002</TableCell>
      <TableCell>Bank transfer</TableCell>
      <TableCell className="text-right tabular-nums">$150.00</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>INV-003</TableCell>
      <TableCell>PayPal</TableCell>
      <TableCell className="text-right tabular-nums">$350.00</TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell className="text-right tabular-nums">$750.00</TableCell>
    </TableRow>
  </TableFooter>
</Table>`,
      },
    ],
  },
]
