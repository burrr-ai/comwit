import * as React from 'react'
import type { Preview } from '@storybook/react-vite'
import { OverlayProvider } from 'overlay-kit'
import { Toaster } from '@comwit/ui-templates/toast'

import '../src/tailwind.css'

/** Global providers match ui-dev: popup.confirm/alert/sheet through overlay-kit and glass toasts through sonner. */
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
