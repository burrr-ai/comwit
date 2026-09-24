'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayButtonProps } from 'react-day-picker'

import { cn } from '../../lib/utils'
import { buttonVariants } from './button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * rdp v9 는 modifier 클래스를 <td>(Day 셀)에만 부여하므로,
 * 배경·라운딩이 숫자 버튼과 어긋나지 않도록 modifier 스타일을 버튼 자체에 칠한다.
 */
function CalendarDayButton({ day: _day, modifiers, className, ...props }: DayButtonProps) {
  return (
    <button
      className={cn(
        className, // = classNames.day_button
        modifiers.today && !modifiers.selected && 'ring-1 ring-inset ring-ring',
        modifiers.selected &&
          !modifiers.range_middle &&
          'bg-primary font-semibold text-primary-foreground hover:bg-primary-strong hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        modifiers.range_middle && 'bg-transparent text-foreground hover:bg-transparent',
        modifiers.outside && 'text-subtle-foreground'
      )}
      {...props}
    />
  )
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center w-full h-8',
        caption_label: 'text-body-sm font-semibold text-foreground',
        nav: 'flex items-center gap-1',
        button_previous:
          'absolute left-1 top-1 z-raised flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast hover:bg-accent',
        button_next:
          'absolute right-1 top-1 z-raised flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast hover:bg-accent',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground w-9 text-caption font-medium',
        week: 'flex w-full mt-1',
        day: 'relative p-0 text-center text-body-sm focus-within:relative focus-within:z-sticky',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-9 p-0 text-body-sm font-normal rounded-pill'
        ),
        range_start: 'day-range-start rounded-l-pill bg-selected',
        range_end: 'day-range-end rounded-r-pill bg-selected',
        selected: '',
        today: '',
        outside: 'day-outside text-subtle-foreground',
        disabled: 'text-disabled-foreground opacity-disabled-content',
        range_middle: 'bg-selected',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        DayButton: CalendarDayButton,
        Chevron: ({ orientation, ...rest }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="size-4" {...rest} />
          }
          return <ChevronRight className="size-4" {...rest} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
