import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@comwit/ui-templates/button'
import { Popover, PopoverTrigger, PopoverContent } from '@comwit/ui-templates/popover'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@comwit/ui-templates/dropdown-menu'

const meta = {
  title: 'Components/Glass',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Theme the document so portaled menus share the preview's tokens; restore it when leaving the story. */
export const OverlayPanels: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Neutral morphing popovers, menus, and submenus over a warm backdrop. Toggle light/dark to compare the panel film.',
      },
    },
  },
  render: () => {
    const [dark, setDark] = React.useState(true)
    React.useEffect(() => {
      const root = document.documentElement
      const previous = root.classList.contains('dark')
      root.classList.toggle('dark', dark)
      return () => {
        root.classList.toggle('dark', previous)
      }
    }, [dark])
    return (
      <div className="text-foreground">
        <div className="relative min-h-[520px] w-[min(90vw,760px)] overflow-hidden rounded-sheet bg-[linear-gradient(135deg,#ae8752_0%,#78685b_45%,#3e667b_75%,#20242b_100%)] p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-1 text-white">
              <p className="text-title-sm">Neutral glass overlays</p>
              <p className="text-body-sm text-white/75">
                Soft gray surfaces over warm and cool colors.
              </p>
            </div>
            <Button
              variant="outline"
              aria-pressed={dark}
              onClick={() => setDark((value) => !value)}
            >
              {dark ? 'Dark mode' : 'Light mode'}
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-16">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">My account</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>jordan@acme.com</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    <DropdownMenuItem>Copy link</DropdownMenuItem>
                    <DropdownMenuItem>Email link</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Share board</Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <p className="text-title-sm">Share this board</p>
                    <p className="text-body-sm text-muted-foreground">
                      Anyone with the link can view.
                    </p>
                  </div>
                  <p className="rounded-control bg-muted/60 px-3 py-2 text-body-sm">
                    comwit.io/b/q3-launch
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    )
  },
}
