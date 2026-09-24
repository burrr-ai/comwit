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
        name: 'Single',
        description: 'type="single" collapsible · 2개 항목',
        render: `<Accordion type="single" collapsible className="w-full max-w-md">
  <AccordionItem value="item-1">
    <AccordionTrigger>배송은 얼마나 걸리나요?</AccordionTrigger>
    <AccordionContent>
      주문 후 영업일 기준 2~3일 이내에 발송되며, 지역에 따라 배송 기간이 달라질 수 있습니다.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>교환 및 환불이 가능한가요?</AccordionTrigger>
    <AccordionContent>
      상품 수령 후 7일 이내에 교환 및 환불을 신청하실 수 있습니다. 단, 사용 흔적이 있는 경우 제한될 수 있습니다.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
      },
    ],
  },
]
