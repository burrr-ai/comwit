'use client'

/**
 * Autocomplete (combobox) styling layer. The comwit-ui Autocomplete primitive (React Aria engine) owns
 * accessibility, keyboard navigation, filtering, open state, and focus. This layer assembles compound parts
 * and applies our visual tokens through per-part className props.
 * Matches the select trigger/content/item/check, input, and popover appearance.
 *
 *   <Autocomplete label="Fruit" placeholder="Search" onSelectionChange={(k) => …}>
 *     <AutocompleteItem key="apple">Apple</AutocompleteItem>
 *     <AutocompleteItem key="banana">Banana</AutocompleteItem>
 *   </Autocomplete>
 */

import * as React from 'react'
import { CheckIcon, ChevronDownIcon } from '@comwit/ui/icons'

import { Autocomplete as AutocompletePrimitive } from '@comwit/ui'
import { focusWithinField } from '@/lib/interaction'
import { cn } from '@/lib/utils/cn'
import { uiText } from '@/lib/ui-text'

type RootPrimitiveProps = React.ComponentProps<typeof AutocompletePrimitive.Root>

type AutocompleteProps = Omit<RootPrimitiveProps, 'collection' | 'children'> & {
  /**
   * Visible label. When omitted, supply aria-label; the primitive requires an accessible name.
   */
  label?: React.ReactNode
  labelClassName?: string
  controlClassName?: string
  inputClassName?: string
  triggerClassName?: string
  contentClassName?: string
  itemClassName?: string
  /**
   * Message displayed when filtering produces no results.
   */
  emptyText?: React.ReactNode
  /**
   * Collection marker: <AutocompleteItem key="…">, passed to the primitive Root collection.
   */
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
  emptyText = uiText.autocomplete.empty,
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
          // Input styling: h-9 border border-input rounded-control, with focus shown by the container.
          'relative flex h-9 w-full items-center rounded-control border border-input bg-transparent transition-[border-color,box-shadow]',
          focusWithinField,
          // Style the control as destructive when it contains an input with aria-invalid.
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
          // Select-content styling and trigger-width matching (--cw-autocomplete-anchor-width). Uses the global hairline border and elevation token.
          'z-dropdown w-[var(--cw-autocomplete-anchor-width)] min-w-menu origin-top overflow-x-hidden overflow-y-auto rounded-card border border-border bg-popover p-2 text-popover-foreground shadow-card-hover',
          'animate-in fade-in-0 zoom-in-95',
          contentClassName
        )}
        itemClassName={cn(
          // Select-item styling.
          'relative flex w-full cursor-pointer items-center gap-2 rounded-control py-2.5 pr-9 pl-3.5 text-body-sm font-medium outline-hidden select-none',
          'data-[focused]:bg-accent data-[focused]:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-disabled',
          // Selection checkmark, positioned absolutely on the right.
          '[&_[data-slot=autocomplete-item-indicator]]:absolute [&_[data-slot=autocomplete-item-indicator]]:right-3 [&_[data-slot=autocomplete-item-indicator]]:text-primary [&_[data-slot=autocomplete-item-indicator]]:flex [&_[data-slot=autocomplete-item-indicator]]:size-3.5 [&_[data-slot=autocomplete-item-indicator]]:items-center [&_[data-slot=autocomplete-item-indicator]]:justify-center',
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          itemClassName
        )}
      />
    </AutocompletePrimitive.Root>
  )
}

// Collection marker: consumers declare options with <AutocompleteItem key="…"> (react-stately Item).
const AutocompleteItem = AutocompletePrimitive.Item
const AutocompleteSection = AutocompletePrimitive.Section

export { Autocomplete, AutocompleteItem, AutocompleteSection }
export type { AutocompleteProps }
