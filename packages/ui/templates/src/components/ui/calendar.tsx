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
        modifiers.today && !modifiers.selected && 'bg-accent text-accent-foreground',
        modifiers.selected &&
          !modifiers.range_middle &&
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        modifiers.range_middle && 'bg-transparent text-accent-foreground hover:bg-transparent',
        modifiers.outside && 'text-muted-foreground'
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
        month_caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 top-1'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 top-1'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-sticky',
        day_button: cn(buttonVariants({ variant: 'ghost' }), 'size-8 p-0 font-normal rounded-md'),
        range_start: 'day-range-start rounded-l-md bg-selected',
        range_end: 'day-range-end rounded-r-md bg-selected',
        selected: '',
        today: '',
        outside: 'day-outside text-muted-foreground',
        disabled: 'text-disabled-foreground',
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
