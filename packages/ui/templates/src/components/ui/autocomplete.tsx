'use client'

/**
 * Autocomplete(combobox) 스타일 레이어. a11y·키보드·필터·open·포커스는
 * comwit-ui `Autocomplete` 프리미티브(내부 엔진: React Aria)가 책임지고, 여기서는
 * 컴파운드 파트를 조립하며 우리 토큰으로 **시각만** 입힌다(파트별 className 주입).
 * 룩은 select(트리거/컨텐츠/아이템/체크) · input · popover 톤을 재현한다.
 *
 *   <Autocomplete label="과일" placeholder="검색" onSelectionChange={(k) => …}>
 *     <AutocompleteItem key="apple">사과</AutocompleteItem>
 *     <AutocompleteItem key="banana">바나나</AutocompleteItem>
 *   </Autocomplete>
 */

import * as React from 'react'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { Autocomplete as AutocompletePrimitive } from '@comwit/ui'
import { focusWithinField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

type RootPrimitiveProps = React.ComponentProps<typeof AutocompletePrimitive.Root>

type AutocompleteProps = Omit<RootPrimitiveProps, 'collection' | 'children'> & {
  /** 보이는 라벨. 생략 시 aria-label 을 넘겨라(프리미티브가 이름 연결을 요구한다). */
  label?: React.ReactNode
  labelClassName?: string
  controlClassName?: string
  inputClassName?: string
  triggerClassName?: string
  contentClassName?: string
  itemClassName?: string
  /** 필터 결과가 없을 때 문구 */
  emptyText?: React.ReactNode
  /** 컬렉션 마커 — <AutocompleteItem key="…"> (프리미티브 Root 의 collection 으로 전달) */
  children?: RootPrimitiveProps['collection']
}

function Autocomplete({
  className,
  label,
  labelClassName,
  controlClassName,
  inputClassName,
  triggerClassName,
  contentClassName,
  itemClassName,
  emptyText = 'No results',
  placeholder,
  children,
  ...props
}: AutocompleteProps) {
  return (
    <AutocompletePrimitive.Root
      allowsEmptyCollection
      collection={children}
      className={cn('flex w-full flex-col gap-1.5', className)}
      {...props}
    >
      {label != null ? (
        <AutocompletePrimitive.Label
          className={cn('text-label font-semibold text-foreground', labelClassName)}
        >
          {label}
        </AutocompletePrimitive.Label>
      ) : null}

      <AutocompletePrimitive.Control
        className={cn(
          // input 톤: h-9 border border-input rounded-control + 포커스는 컨테이너가 표시
          'relative flex h-9 w-full items-center rounded-control border border-input bg-transparent transition-[border-color,box-shadow]',
          focusWithinField,
          // input(aria-invalid) 이 있으면 컨트롤을 destructive 로
          'has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-field has-[input[aria-invalid=true]]:ring-destructive/20',
          'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-disabled',
          controlClassName
        )}
      >
        <AutocompletePrimitive.Input
          placeholder={placeholder}
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent px-3 text-body-sm outline-none placeholder:text-subtle-foreground selection:bg-primary selection:text-primary-foreground disabled:cursor-not-allowed',
            inputClassName
          )}
        />
        <AutocompletePrimitive.Trigger
          className={cn(
            'flex h-full items-center px-2 text-muted-foreground outline-none disabled:text-disabled-foreground',
            triggerClassName
          )}
        >
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </AutocompletePrimitive.Trigger>
      </AutocompletePrimitive.Control>

      <AutocompletePrimitive.Content
        itemIndicator={<CheckIcon className="size-4" />}
        emptyState={
          <div className="px-2 py-6 text-center text-body-sm text-muted-foreground">
            {emptyText}
          </div>
        }
        className={cn(
          // select content 톤 + 트리거 폭 매칭(--cw-autocomplete-anchor-width). 보더는 전역 hairline, elevation 은 토큰.
          'z-dropdown w-[var(--cw-autocomplete-anchor-width)] min-w-menu origin-top overflow-x-hidden overflow-y-auto rounded-card border border-border bg-popover p-2 text-popover-foreground shadow-card-hover',
          'animate-in fade-in-0 zoom-in-95',
          contentClassName
        )}
        itemClassName={cn(
          // select item 톤
          'relative flex w-full cursor-pointer items-center gap-2 rounded-control py-2.5 pr-9 pl-3.5 text-body-sm font-medium outline-hidden select-none',
          'data-[focused]:bg-accent data-[focused]:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-disabled',
          // 선택 표식(체크) — 우측 절대배치
          '[&_[data-slot=autocomplete-item-indicator]]:absolute [&_[data-slot=autocomplete-item-indicator]]:right-3 [&_[data-slot=autocomplete-item-indicator]]:text-primary [&_[data-slot=autocomplete-item-indicator]]:flex [&_[data-slot=autocomplete-item-indicator]]:size-3.5 [&_[data-slot=autocomplete-item-indicator]]:items-center [&_[data-slot=autocomplete-item-indicator]]:justify-center',
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          itemClassName
        )}
      />
    </AutocompletePrimitive.Root>
  )
}

// 컬렉션 마커 — 소비처는 <AutocompleteItem key="…"> 로 옵션을 선언한다(react-stately Item).
const AutocompleteItem = AutocompletePrimitive.Item
const AutocompleteSection = AutocompletePrimitive.Section

export { Autocomplete, AutocompleteItem, AutocompleteSection }
export type { AutocompleteProps }
