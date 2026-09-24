import * as React from 'react'
import type { Preview } from '@storybook/react-vite'
import { OverlayProvider } from 'overlay-kit'
import { Toaster } from '@comwit/ui-templates/sonner'

import '../src/tailwind.css'

/** 전역 프로바이더 — popup.confirm/alert/sheet(overlay-kit) + sonner 토스트. ui-dev providers 와 동일. */
const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <OverlayProvider>
        <div className="text-foreground">
          <Story />
        </div>
        <Toaster />
      </OverlayProvider>
    ),
  ],
}

export default preview
