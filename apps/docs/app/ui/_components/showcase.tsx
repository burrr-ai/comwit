'use client'

import { useState } from 'react'
import { Button } from '@comwit/ui-templates/button'
import { Input } from '@comwit/ui-templates/input'
import { Label } from '@comwit/ui-templates/label'
import { Switch } from '@comwit/ui-templates/switch'

export function UiShowcase() {
  const [name, setName] = useState('My workspace')
  const [notifications, setNotifications] = useState(true)
  const [saved, setSaved] = useState(false)
  return (
    <form
      className="ui-showcase"
      onSubmit={(e) => {
        e.preventDefault()
        setSaved(true)
      }}
    >
      <div>
        <p className="showcase-kicker">A LITTLE PREVIEW</p>
        <h2>Workspace settings</h2>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input
          id="workspace-name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
        />
      </div>
      <div className="showcase-switch">
        <div>
          <Label htmlFor="workspace-notifications">Email notifications</Label>
          <p>Only the updates you need.</p>
        </div>
        <Switch
          id="workspace-notifications"
          checked={notifications}
          onCheckedChange={(value) => {
            setNotifications(value)
            setSaved(false)
          }}
        />
      </div>
      <div className="showcase-bottom">
        <span role="status">{saved ? 'Preferences saved for this preview.' : ''}</span>
        <Button type="submit">{saved ? 'Saved' : 'Save changes'}</Button>
      </div>
    </form>
  )
}
