export const specs = [
  {
    title: 'Tabs',
    slug: 'tabs',
    covers: ['tabs'],
    imports: [
      {
        from: '@comwit/ui-templates/tabs',
        names: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'],
      },
    ],
    extraImports: [`import { BarChart3, Bell, LayoutGrid, Settings } from 'lucide-react'`],
    stories: [
      {
        name: 'Project',
        gallery: true,
        description: 'The active tab lifts out of the track as a white segment.',
        render: `<Tabs defaultValue="overview" className="w-full max-w-md">
  <TabsList className="w-full">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className="rounded-card border border-border p-4">
    <p className="text-title-sm text-foreground">Q3 roadmap</p>
    <p className="mt-1 text-body-sm text-soft-foreground">12 of 18 milestones shipped · updated 2 hours ago</p>
  </TabsContent>
  <TabsContent value="activity" className="rounded-card border border-border p-4">
    <p className="text-title-sm text-foreground">Recent activity</p>
    <p className="mt-1 text-body-sm text-soft-foreground">Morgan closed 3 issues and merged 1 pull request.</p>
  </TabsContent>
  <TabsContent value="settings" className="rounded-card border border-border p-4">
    <p className="text-title-sm text-foreground">Project settings</p>
    <p className="mt-1 text-body-sm text-soft-foreground">Rename the project, change visibility or archive it.</p>
  </TabsContent>
</Tabs>`,
      },
      {
        name: 'WithIcons',
        description: 'Icons inside TabsTrigger are sized automatically.',
        render: `<Tabs defaultValue="dashboard" className="w-full max-w-md">
  <TabsList>
    <TabsTrigger value="dashboard">
      <LayoutGrid /> Dashboard
    </TabsTrigger>
    <TabsTrigger value="reports">
      <BarChart3 /> Reports
    </TabsTrigger>
    <TabsTrigger value="alerts">
      <Bell /> Alerts
    </TabsTrigger>
  </TabsList>
  <TabsContent value="dashboard" className="p-1 text-body-sm text-soft-foreground">
    Revenue is up 8.2% compared with last week.
  </TabsContent>
  <TabsContent value="reports" className="p-1 text-body-sm text-soft-foreground">
    Your monthly report is ready to download.
  </TabsContent>
  <TabsContent value="alerts" className="p-1 text-body-sm text-soft-foreground">
    No alerts in the last 24 hours.
  </TabsContent>
</Tabs>`,
      },
      {
        name: 'DisabledTab',
        description: 'A disabled trigger is skipped by keyboard navigation.',
        render: `<Tabs defaultValue="general" className="w-full max-w-md">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="members">Members</TabsTrigger>
    <TabsTrigger value="billing" disabled>
      <Settings /> Billing
    </TabsTrigger>
  </TabsList>
  <TabsContent value="general" className="p-1 text-body-sm text-soft-foreground">
    Workspace name, URL and default language.
  </TabsContent>
  <TabsContent value="members" className="p-1 text-body-sm text-soft-foreground">
    Invite people and manage their roles.
  </TabsContent>
  <TabsContent value="billing" className="p-1 text-body-sm text-soft-foreground">
    Only owners can view billing.
  </TabsContent>
</Tabs>`,
      },
    ],
  },
]
